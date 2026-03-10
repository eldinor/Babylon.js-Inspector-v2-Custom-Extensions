/**
 * ImportGLB Service - Advanced GLB Model Management for Babylon.js Inspector
 *
 * This service provides comprehensive GLB file management capabilities:
 *
 * FEATURES:
 * - Load GLB files into AssetContainers for efficient memory management
 * - Create clones (independent geometry copies) and instances (shared geometry) from loaded models
 * - Individual disposal of models, clones, and instances with material preservation
 * - Automatic synchronization with Scene Explorer when models are disposed externally
 * - Quick selection of loaded models and their derivatives in the Inspector
 * - Auto-select toggle to control whether loaded/created models are automatically selected
 * - Batch disposal with "Dispose All" button
 *
 * USAGE:
 * - Click file names to select the model in the Inspector
 * - Use Clone icon (brown) to create independent copies with separate geometry
 * - Use Instance icon (green) to create lightweight instances sharing geometry
 * - Click Delete icons to remove individual models, clones, or instances
 * - Toggle "Auto-select loaded model" to control automatic selection behavior
 * - Use "Dispose All" to clean up all loaded models and their derivatives
 *
 * TECHNICAL NOTES:
 * - Models are loaded into AssetContainers for better resource management
 * - Clones use doNotInstantiate: true (independent geometry, higher memory usage)
 * - Instances use doNotInstantiate: false (shared geometry, lower memory usage)
 * - Materials are preserved when disposing clones/instances to avoid breaking shared resources
 * - onDisposeObservable watchers ensure UI stays synchronized with scene state
 */

import { useState, useEffect } from "react";
import type { FunctionComponent } from "react";
import type { Scene } from "@babylonjs/core/scene";
import type { AssetContainer } from "@babylonjs/core/assetContainer";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader";
import { Logger } from "@babylonjs/core/Misc/logger";
import { FileUploadLine, type ISelectionService, useTheme } from "@babylonjs/inspector";
import { Delete16Regular, Copy16Regular, DocumentCopy16Regular } from "@fluentui/react-icons";
import { Button, Tooltip, Switch } from "@fluentui/react-components";

interface CloneInstance {
  name: string;
  rootNode: TransformNode;
  type: "clone" | "instance";
}

interface LoadedFile {
  name: string;
  size: number;
  meshName: string;
  container: AssetContainer;
  clones: CloneInstance[];
}

function syncRootTransform(target: TransformNode, source: TransformNode | AbstractMesh | null | undefined) {
  if (!source) {
    return;
  }

  target.position.copyFrom(source.position);
  target.scaling.copyFrom(source.scaling);

  if (source.rotationQuaternion) {
    target.rotationQuaternion = source.rotationQuaternion.clone();
  } else {
    target.rotationQuaternion = null;
    target.rotation.copyFrom(source.rotation);
  }
}

function MeshIcon() {
  return (
    <svg
      fill="currentColor"
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.03,3.54l-5.11-2.07c-.61-.25-1.27-.25-1.88,0L1.93,3.54c-.57.23-.94.78-.94,1.39v6.15c0,.61.37,1.16.94,1.39l5.11,2.07c.3.12.62.18.94.18s.64-.06.94-.18l5.12-2.07c.57-.23.94-.78.94-1.39v-6.15c0-.61-.37-1.16-.94-1.39ZM13.97,7.71l-2.11.86v-2.71l2.11-.86v2.71ZM1.99,5l2.11.86v2.71l-2.11-.86v-2.71ZM11.35,4.98l-2.04-.83,1.78-.72,2.04.83-1.78.72ZM10.02,5.52l-2.04.83-2.04-.83,2.04-.83,2.04.83ZM4.6,4.98l-1.78-.72,2.04-.83,1.78.72-2.04.83ZM5.1,6.26l2.38.96v2.71l-2.38-.96v-2.71ZM8.48,7.22l2.38-.96v2.71l-2.38.96v-2.71ZM7.41,2.39c.18-.07.37-.11.56-.11s.38.04.56.11l1.22.49-1.78.72-1.79-.72,1.22-.49ZM1.99,11.07v-2.29l2.11.86v2.62l-1.8-.73c-.19-.08-.31-.26-.31-.46ZM5.1,12.67v-2.62l2.38.96v2.61s-.04,0-.06-.01l-2.31-.94ZM8.54,13.61s-.04,0-.06.01v-2.61l2.38-.96v2.62l-2.31.94ZM13.66,11.54l-1.8.73v-2.62l2.11-.86v2.29c0,.2-.12.39-.31.46Z" />
    </svg>
  );
}

export const ImportGLBTools: FunctionComponent<{ scene: Scene; selectionService: ISelectionService }> = ({
  scene,
  selectionService,
}) => {
  const theme = useTheme();
  const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);

  // Load auto-select setting from localStorage, default to true
  const [autoSelectModel, setAutoSelectModel] = useState<boolean>(() => {
    const saved = localStorage.getItem("importGLB_autoSelectModel");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save auto-select setting to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("importGLB_autoSelectModel", JSON.stringify(autoSelectModel));
  }, [autoSelectModel]);

  // Watch for disposal of loaded containers and clones/instances
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const observers: Array<{ node: AbstractMesh | TransformNode; observer: any }> = [];

    loadedFiles.forEach((file, fileIndex) => {
      // Watch the main container's first mesh for disposal
      if (file.container.meshes.length > 0) {
        const mainMesh = file.container.meshes[0];
        const observer = mainMesh.onDisposeObservable.add(() => {
          Logger.Log(`Container mesh disposed externally: ${file.name}`);
          setLoadedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
        });
        observers.push({ node: mainMesh, observer });
      }

      // Watch each clone/instance for disposal
      file.clones.forEach((clone) => {
        const cloneRootNode = clone.rootNode;
        const observer = cloneRootNode.onDisposeObservable.add(() => {
          Logger.Log(`${clone.type} disposed: ${clone.name}`);
          setLoadedFiles((prev) => {
            return prev.map((f) => ({
              ...f,
              clones: f.clones.filter((c) => c.rootNode !== cloneRootNode),
            }));
          });
        });
        observers.push({ node: cloneRootNode, observer });
      });
    });

    // Cleanup observers when component unmounts or loadedFiles changes
    return () => {
      observers.forEach(({ node, observer }) => {
        if (node.onDisposeObservable && observer) {
          node.onDisposeObservable.remove(observer);
        }
      });
    };
  }, [loadedFiles]);

  const loadGLB = async (files: FileList) => {
    if (!files || files.length === 0) {
      Logger.Warn("No file selected");
      return;
    }

    const file = files[0];

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".glb")) {
      Logger.Error("Please select a valid GLB file");
      return;
    }

    // Create a URL for the file
    const fileURL = URL.createObjectURL(file);

    try {
      // Load the GLB file
      Logger.Log(`Loading GLB file: ${file.name}`);

      const container = await LoadAssetContainerAsync(fileURL, scene, { pluginExtension: ".glb" });
      const meshName = file.name.substring(0, file.name.lastIndexOf("."));
      container.meshes[0].name = meshName;
      container.addAllToScene();

      Logger.Log(`Successfully loaded ${file.name}`);

      // Select the first mesh from the loaded container (if auto-select is enabled)
      if (autoSelectModel && container.meshes.length > 0) {
        selectionService.selectedEntity = container.meshes[0];
        Logger.Log(`Selected mesh: ${container.meshes[0].name}`);
      }

      // Add to loaded files list
      setLoadedFiles((prev) => [...prev, { name: file.name, size: file.size, meshName, container, clones: [] }]);

      // Auto-play animations if any
      /*
            if (scene.animationGroups.length > 0) {
                Logger.Log(`Found ${scene.animationGroups.length} animation group(s)`);
                scene.animationGroups.forEach((animationGroup, index) => {
                    Logger.Log(`Playing animation: ${animationGroup.name || `Animation ${index}`}`);
                    animationGroup.play(true);
                });
            }
*/
    } catch (error) {
      Logger.Error(`Error loading GLB file: ${error}`);
    } finally {
      // Always clean up the object URL, even if there was an error
      URL.revokeObjectURL(fileURL);
    }
  };

  const handleDelete = (index: number) => {
    const fileToDelete = loadedFiles[index];

    // Dispose the container
    fileToDelete.container.dispose();
    Logger.Log(`Disposed container: ${fileToDelete.name}`);

    // Remove from the list
    setLoadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDisposeAll = () => {
    // Dispose all containers and their clones/instances
    loadedFiles.forEach((file) => {
      // Dispose all clones and instances first (preserve materials)
      file.clones.forEach((clone) => {
        // Dispose the root node and all its children recursively
        clone.rootNode.dispose(false, false);
        Logger.Log(`Disposed ${clone.type}: ${clone.name}`);
      });

      // Dispose the container
      file.container.dispose();
      Logger.Log(`Disposed container: ${file.name}`);
    });

    // Clear the list
    setLoadedFiles([]);
    Logger.Log("All containers disposed");
  };

  const handleClone = (index: number) => {
    const file = loadedFiles[index];
    const sourceRoot = (file.container.rootNodes[0] as TransformNode | null | undefined) ?? file.container.meshes[0];

    // Clone using instantiateModelsToScene with doNotInstantiate: true
    const result = file.container.instantiateModelsToScene(undefined, false, { doNotInstantiate: true });

    if (result.rootNodes.length > 0) {
      const rootNode = result.rootNodes[0] as TransformNode;
      const cloneName = `${file.meshName}_clone_${file.clones.filter((c) => c.type === "clone").length + 1}`;
      rootNode.name = cloneName;
      syncRootTransform(rootNode, sourceRoot);

      // Add to clones list
      setLoadedFiles((prev) => {
        const updated = [...prev];
        updated[index].clones.push({ name: cloneName, rootNode, type: "clone" });
        return updated;
      });

      // Select the first root node (if auto-select is enabled)
      if (autoSelectModel) {
        selectionService.selectedEntity = rootNode;
      }
      Logger.Log(`Cloned container: ${file.name} as ${cloneName}`);
    }
  };

  const handleInstance = (index: number) => {
    const file = loadedFiles[index];
    const sourceRoot = (file.container.rootNodes[0] as TransformNode | null | undefined) ?? file.container.meshes[0];

    // Instance using instantiateModelsToScene with doNotInstantiate: false
    const result = file.container.instantiateModelsToScene(undefined, false, { doNotInstantiate: false });

    if (result.rootNodes.length > 0) {
      const rootNode = result.rootNodes[0] as TransformNode;
      const instanceName = `${file.meshName}_instance_${file.clones.filter((c) => c.type === "instance").length + 1}`;
      rootNode.name = instanceName;
      syncRootTransform(rootNode, sourceRoot);

      // Add to clones list
      setLoadedFiles((prev) => {
        const updated = [...prev];
        updated[index].clones.push({ name: instanceName, rootNode, type: "instance" });
        return updated;
      });

      // Select the first root node (if auto-select is enabled)
      if (autoSelectModel) {
        selectionService.selectedEntity = rootNode;
      }
      Logger.Log(`Instanced container: ${file.name} as ${instanceName}`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 12px 12px" }}>
      <FileUploadLine label="Load GLB File" accept=".glb" onClick={(files: FileList) => loadGLB(files)} />

      {loadedFiles.length > 0 && (
        <div style={{ marginTop: "4px" }}>
          <h4 style={{ margin: 0, marginBottom: "8px", fontSize: "14px", fontWeight: 600 }}>Loaded Files:</h4>
          <ul style={{ listStyleType: "none", paddingLeft: 0, margin: 0, marginTop: "6px" }}>
            {loadedFiles.map((file, index) => {
              const handleClick = () => {
                const mesh = scene.getMeshByName(file.meshName);
                if (mesh) {
                  selectionService.selectedEntity = mesh;
                  Logger.Log(`Selected mesh: ${mesh.name}`);
                }
              };

              return (
                <li
                  key={index}
                  style={{
                    padding: "8px 0",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    <span
                      onClick={handleClick}
                      style={{
                        cursor: "pointer",
                        textDecoration: "underline",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <MeshIcon />
                      {file.name}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: theme.colorNeutralForeground3,
                        marginLeft: "24px",
                      }}
                    >
                      {((file.size / 1024) / 1024).toFixed(2) + "MB"}
                    </span>
                    {file.clones.length > 0 && (
                      <div style={{ marginLeft: "24px", marginTop: "8px" }}>
                        {file.clones.map((clone, cloneIndex) => {
                          const handleCloneClick = () => {
                            selectionService.selectedEntity = clone.rootNode;
                            Logger.Log(`Selected ${clone.type}: ${clone.name}`);
                          };

                          const handleCloneDispose = () => {
                            // Dispose the clone/instance (preserve materials)
                            // The onDisposeObservable will automatically remove it from the list
                            clone.rootNode.dispose(false, false);
                            Logger.Log(`Disposed ${clone.type}: ${clone.name}`);
                          };

                          return (
                            <div
                              key={cloneIndex}
                              style={{
                                fontSize: "11px",
                                marginTop: "6px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <span
                                onClick={handleCloneClick}
                                style={{
                                  cursor: "pointer",
                                  color: theme.colorNeutralForeground1,
                                  textDecoration: "underline",
                                  display: "inline-flex",
                                  alignItems: "center",
                                   gap: "6px",
                                }}
                              >
                                {clone.type === "clone" ? <Copy16Regular /> : <DocumentCopy16Regular />}
                                {clone.name}
                              </span>
                              <Tooltip content="Delete" relationship="label">
                                <Delete16Regular
                                  onClick={handleCloneDispose}
                                  style={{ cursor: "pointer", color: theme.colorStatusDangerForeground1 }}
                                />
                              </Tooltip>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", paddingTop: "2px" }}>
                    <Tooltip content="Clone" relationship="label">
                      <Copy16Regular
                        onClick={() => handleClone(index)}
                        style={{
                          cursor: "pointer",
                          color: theme.colorNeutralForeground1,
                          flexShrink: 0,
                        }}
                      />
                    </Tooltip>
                    <Tooltip content="Instance" relationship="label">
                      <DocumentCopy16Regular
                        onClick={() => handleInstance(index)}
                        style={{
                          cursor: "pointer",
                          color: theme.colorNeutralForeground1,
                          flexShrink: 0,
                        }}
                      />
                    </Tooltip>
                    <Tooltip content="Delete" relationship="label">
                      <Delete16Regular
                        onClick={() => handleDelete(index)}
                        style={{
                          cursor: "pointer",
                          color: theme.colorStatusDangerForeground1,
                          flexShrink: 0,
                        }}
                      />
                    </Tooltip>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button appearance="secondary" onClick={handleDisposeAll} style={{ marginTop: "12px", width: "100%" }}>
            Dispose All
          </Button>
          <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Switch
              checked={autoSelectModel}
              onChange={(e) => setAutoSelectModel(e.currentTarget.checked)}
              label="Auto-select loaded model"
            />
          </div>
        </div>
      )}
    </div>
  );
};
