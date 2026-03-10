import type { ReflectionProbe } from "@babylonjs/core/Probes/reflectionProbe";
import type { Material } from "@babylonjs/core/Materials/material";
import type { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { useMemo, useState } from "react";
import {
  ServiceDefinition,
  ISceneExplorerService,
  SceneExplorerServiceIdentity,
  ISceneContext,
  SceneContextIdentity,
  IPropertiesService,
  PropertiesServiceIdentity,
  ISelectionService,
  SelectionServiceIdentity,
  Button,
  Link,
  LinkToEntityPropertyLine,
  MessageBar,
  SearchBar,
} from "@babylonjs/inspector";
import { CubeRegular, Delete16Regular, Add16Regular } from "@fluentui/react-icons";

// ServiceDefinition that retrieves Reflection Probes from the scene
export const ReflectionProbesServiceDefinition: ServiceDefinition<
  [],
  [ISceneExplorerService, ISceneContext, IPropertiesService, ISelectionService]
> = {
  friendlyName: "Reflection Probes",
  consumes: [
    SceneExplorerServiceIdentity,
    SceneContextIdentity,
    PropertiesServiceIdentity,
    SelectionServiceIdentity,
  ],
  // This factory function creates the instance of the service.
  // It is effectively called when ShowInspector is called.
  factory: (sceneExplorerService, sceneContext, propertiesService, selectionService) => {
    const refreshSelection = () => {
      const currentEntity = selectionService.selectedEntity;
      selectionService.selectedEntity = null;
      setTimeout(() => {
        selectionService.selectedEntity = currentEntity;
      }, 0);
    };

    const ProbeMissingMessage = () => (
      <MessageBar title="Reflection Probe" message="Probe not found." intent="warning" />
    );

    const EmptyState = ({ message }: { message: string }) => (
      <MessageBar title="Reflection Probe" message={message} intent="info" />
    );

    const EntityActionRow = ({
      label,
      entity,
      actionLabel,
      actionIcon,
      onAction,
      children,
    }: {
      label?: string;
      entity: AbstractMesh | Material;
      actionLabel: string;
      actionIcon: typeof Delete16Regular;
      onAction: () => void;
      children?: React.ReactNode;
    }) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: "4px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {label ? (
              <LinkToEntityPropertyLine label={label} entity={entity} selectionService={selectionService} />
            ) : (
              <Link
                value={entity.name || "Unnamed"}
                onLink={() => {
                  selectionService.selectedEntity = entity;
                }}
              />
            )}
          </div>
          <div title={actionLabel} style={{ flexShrink: 0 }}>
            <Button appearance="transparent" icon={actionIcon} onClick={onAction} />
          </div>
        </div>
        {children}
      </div>
    );

    // Store wrapped probe entities to maintain reference equality
    const wrappedProbes: unknown[] = [];
    // Map to store the original probe for each wrapped entity
    const probeMap = new WeakMap<object, ReflectionProbe>();

    // This adds a new section to Scene Explorer.
    const sectionRegistration = sceneExplorerService.addSection({
      // This is the name of the top level tree view item that will be displayed in Scene Explorer.
      displayName: "Reflection Probes",
      // This gets the immediate children of the top level tree view item.
      // We retrieve reflection probes directly from the scene
      getRootEntities: () => {
        const scene = sceneContext.currentScene;
        if (!scene || !scene.reflectionProbes) {
          wrappedProbes.length = 0;
          return [];
        }
        // Map reflection probes to objects with uniqueId property
        // Clear and repopulate the array
        wrappedProbes.length = 0;
        const entities = scene.reflectionProbes.map((probe, index) => {
          const wrapped = {
            ...probe,
            uniqueId: index, // Use index as uniqueId since ReflectionProbe doesn't have one
          };
          // Store the original probe reference
          probeMap.set(wrapped, probe);
          return wrapped;
        });
        wrappedProbes.push(...entities);
        return entities as unknown as readonly Readonly<{ uniqueId: number }>[];
      },
      // This gets the display info for an entity, which is primarily the name, and optionally can include
      // an Observable that notifies the display info (e.g. name) has changed.
      getEntityDisplayInfo: (entity) => {
        const probe = entity as unknown as ReflectionProbe;
        return {
          name: probe.name,
        };
      },
      entityIcon: () => <CubeRegular />,
      // Reflection probes don't have built-in add/remove observables in the scene
      // Return empty arrays for now
      getEntityAddedObservables: () => [],
      getEntityRemovedObservables: () => [],
    });

    // This adds new sections to the Properties pane for Reflection Probes
    const probePropertiesRegistration = propertiesService.addSectionContent({
      key: "Reflection Probe Properties",
      predicate: (entity: unknown): entity is ReflectionProbe => {
        // Check if the entity is one of our wrapped probes
        return wrappedProbes.includes(entity);
      },
      content: [
        {
          section: "Meshes in Probe Renderlist",
          component: ({ context }) => {
            // Get the original probe from the map
            const probe = probeMap.get(context as object);
            if (!probe) {
              return <ProbeMissingMessage />;
            }

            const renderList = probe.renderList || [];

            const handleRemoveMesh = (meshToRemove: AbstractMesh) => {
              if (probe.renderList) {
                const index = probe.renderList.indexOf(meshToRemove);
                if (index > -1) {
                  probe.renderList.splice(index, 1);
                  refreshSelection();
                }
              }
            };

            if (renderList.length === 0) {
              return <EmptyState message="No meshes in the render list." />;
            }

            return (
              <>
                {renderList.map((mesh, index) => (
                  <EntityActionRow
                    key={mesh.uniqueId ?? index}
                    label={undefined}
                    entity={mesh}
                    actionLabel="Remove mesh"
                    actionIcon={Delete16Regular}
                    onAction={() => handleRemoveMesh(mesh)}
                  />
                ))}
              </>
            );
          },
        },
        {
          section: "Add Mesh",
          component: ({ context }) => {
            const [query, setQuery] = useState("");
            // Get the original probe from the map
            const probe = probeMap.get(context as object);
            if (!probe) {
              return <ProbeMissingMessage />;
            }

            const scene = sceneContext.currentScene;
            const renderList = probe.renderList || [];

            // Find all meshes that are not already in the renderList.
            const availableMeshes = useMemo(() => {
              if (!scene) {
                return [];
              }

              return scene.meshes.filter((mesh) => {
                if (renderList.includes(mesh)) {
                  return false;
                }

                const hasGeometry = mesh.geometry !== null && mesh.geometry !== undefined;
                const hasPBRMaterial = mesh.material && mesh.material.getClassName() === "PBRMaterial";

                if (!hasGeometry && !hasPBRMaterial) {
                  return false;
                }

                if (!query.trim()) {
                  return true;
                }

                return (mesh.name || "").toLowerCase().includes(query.trim().toLowerCase());
              });
            }, [query, renderList, scene]);

            const handleAddMesh = (mesh: AbstractMesh) => {
              if (!probe.renderList) {
                probe.renderList = [];
              }
              probe.renderList.push(mesh);
              refreshSelection();
            };

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <SearchBar onChange={setQuery} placeholder="Filter meshes" />
                {availableMeshes.length === 0 ? (
                  <EmptyState message="No available meshes to add." />
                ) : (
                  availableMeshes.map((mesh, index) => (
                    <EntityActionRow
                      key={mesh.uniqueId ?? index}
                      label={undefined}
                      entity={mesh}
                      actionLabel="Add mesh"
                      actionIcon={Add16Regular}
                      onAction={() => handleAddMesh(mesh)}
                    />
                  ))
                )}
              </div>
            );
          },
        },
        {
          section: "Materials Reflected This Probe",
          component: ({ context }) => {
            // Get the original probe from the map
            const probe = probeMap.get(context as object);
            if (!probe) {
              return <ProbeMissingMessage />;
            }

            const scene = sceneContext.currentScene;

            // Find all materials that use this probe's cubeTexture as reflectionTexture
            const materialsUsingProbe = scene ? scene.materials.filter((material: Material) => {
              // Check if material has reflectionTexture property (PBRMaterial, StandardMaterial, etc.)
              const mat = material as PBRMaterial | StandardMaterial;
              return mat.reflectionTexture === probe.cubeTexture;
            }) : [];

            const handleRemoveMaterial = (material: Material) => {
              const mat = material as PBRMaterial | StandardMaterial;
              if (mat.reflectionTexture) {
                mat.reflectionTexture = null;
                refreshSelection();
              }
            };

            if (materialsUsingProbe.length === 0) {
              return <EmptyState message="No materials use this probe." />;
            }

            return (
              <>
                {materialsUsingProbe.map((material, index) => {
                  const mat = material as PBRMaterial | StandardMaterial;
                  const boundMeshes = mat.getBindedMeshes ? mat.getBindedMeshes() : [];

                  return (
                    <EntityActionRow
                      key={material.uniqueId ?? index}
                      label="Material"
                      entity={material}
                      actionLabel="Remove material"
                      actionIcon={Delete16Regular}
                      onAction={() => handleRemoveMaterial(material)}
                    >
                      {boundMeshes.length > 0 ? (
                        <div style={{ marginLeft: "16px" }}>
                          {boundMeshes.map((mesh, meshIndex) => (
                            <Link
                              key={mesh.uniqueId ?? meshIndex}
                              value={mesh.name || `Mesh ${meshIndex}`}
                              onLink={() => {
                                selectionService.selectedEntity = mesh;
                              }}
                            />
                          ))}
                        </div>
                      ) : null}
                    </EntityActionRow>
                  );
                })}
              </>
            );
          },
        },
        {
          section: "Add Material",
          component: ({ context }) => {
            const [query, setQuery] = useState("");
            // Get the original probe from the map
            const probe = probeMap.get(context as object);
            if (!probe) {
              return <ProbeMissingMessage />;
            }

            const scene = sceneContext.currentScene;

            // Get the renderList to check which materials are bound to meshes in it
            const renderList = probe.renderList || [];
            const renderListMaterials = new Set<Material>();
            renderList.forEach((mesh) => {
              if (mesh.material) {
                renderListMaterials.add(mesh.material);
              }
            });

            // Find all PBR materials that are NOT using this probe and are NOT "default material"
            const availableMaterials = useMemo(() => {
              if (!scene) {
                return [];
              }

              return scene.materials.filter((material: Material) => {
                if (material.getClassName() !== "PBRMaterial") {
                  return false;
                }

                if (material.name === "default material") {
                  return false;
                }

                if (renderListMaterials.has(material)) {
                  return false;
                }

                const mat = material as PBRMaterial;
                if (mat.reflectionTexture === probe.cubeTexture) {
                  return false;
                }

                if (!query.trim()) {
                  return true;
                }

                return (material.name || "").toLowerCase().includes(query.trim().toLowerCase());
              });
            }, [probe.cubeTexture, query, renderListMaterials, scene]);

            const handleAddMaterial = (material: Material) => {
              const mat = material as PBRMaterial;
              mat.reflectionTexture = probe.cubeTexture;
              refreshSelection();
            };

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <SearchBar onChange={setQuery} placeholder="Filter materials" />
                {availableMaterials.length === 0 ? (
                  <EmptyState message="No available materials to add." />
                ) : (
                  availableMaterials.map((material, index) => {
                    const mat = material as PBRMaterial;
                    const boundMeshes = mat.getBindedMeshes ? mat.getBindedMeshes() : [];

                    return (
                      <EntityActionRow
                        key={material.uniqueId ?? index}
                        label={undefined}
                        entity={material}
                        actionLabel="Add material"
                        actionIcon={Add16Regular}
                        onAction={() => handleAddMaterial(material)}
                      >
                        {boundMeshes.length > 0 ? (
                          <div style={{ marginLeft: "16px" }}>
                            {boundMeshes.map((mesh, meshIndex) => (
                              <Link
                                key={mesh.uniqueId ?? meshIndex}
                                value={mesh.name || `Mesh ${meshIndex}`}
                                onLink={() => {
                                  selectionService.selectedEntity = mesh;
                                }}
                              />
                            ))}
                          </div>
                        ) : null}
                      </EntityActionRow>
                    );
                  })
                )}
              </div>
            );
          },
        },
      ],
    });

    return {
      dispose: () => {
        sectionRegistration.dispose();
        probePropertiesRegistration.dispose();
      },
    };
  },
};

