import { Scene,  } from "@babylonjs/core";
import {
  ShellServiceIdentity,
  type IShellService,
  SceneContextIdentity,
  type ISceneContext,
  type ISelectionService,
  SelectionServiceIdentity,
  useObservableState,
  type ServiceDefinition
} from "@babylonjs/inspector";
import { type FunctionComponent, useCallback, useMemo } from "react";
import { DataTreemapRegular } from "@fluentui/react-icons";
import ReactECharts from "echarts-for-react";


export const VertexTreeMapServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext, ISelectionService]> =
  {
    friendlyName: "Vertex Tree Map",
    consumes: [ShellServiceIdentity, SceneContextIdentity, SelectionServiceIdentity],
    factory: (shellService, sceneContext, selectionService) => {
      // Define the React component for the mesh vertices treemap
      const MeshVerticesTreeMap: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
        const meshes = useObservableState(
          useCallback(() => [...scene.meshes], [scene]),
          scene.onNewMeshAddedObservable,
          scene.onMeshRemovedObservable
        );

        const data = useMemo(() => {
          return meshes
            .filter((mesh) => mesh.getTotalVertices() > 0)
            .map((mesh) => {
              return {
                name: mesh.name,
                value: mesh.getTotalVertices(),
                itemStyle: {
                  borderColor: "#00000000",
                },
                uniqueId: mesh.uniqueId,
              };
            });
        }, [meshes]);

        const option = {
          tooltip: {
            formatter: (info: Record<string, unknown>) => {
              const value = info.value;
              return `${info.name}: ${value} Vertices`;
            },
          },
          series: [
            {
              type: "treemap",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              roam: false,
              nodeClick: false,
              breadcrumb: { show: false },
              itemStyle: {
                borderColor: "#00000000",
                borderWidth: 2,
              },
              data,
            },
          ],
        };

        return (
          <div style={{ display: "flex", flex: 1, padding: "12px" }}>
            <ReactECharts
              option={option}
              style={{ height: "100%", width: "100%" }}
              onEvents={{
                click: (params: Record<string, unknown>) => {
                  const data = params.data as Record<string, unknown>;
                  const uniqueId = data.uniqueId as number;
                  const mesh = scene.getMeshByUniqueId(uniqueId);
                  if (mesh) {
                    selectionService.selectedEntity = mesh;
                  }
                },
              }}
            />
          </div>
        );
      };

      const sidePaneRegistration = shellService.addSidePane({
        key: "Vertex Tree Map",
        title: "Vertex Tree Map",
        order: 450,
        icon: DataTreemapRegular,
        horizontalLocation: "right",
        verticalLocation: "top",
        teachingMoment: {
          title: "Vertex Tree Map",
          description: "Analyze mesh vertex cost visually and click a block to select the mesh in the scene.",
        },
        content: () => {
          const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

          return scene ? <MeshVerticesTreeMap scene={scene} /> : null;
        },
      });

      return {
        dispose: () => {
          sidePaneRegistration.dispose();
        },
      };
    },
  };
