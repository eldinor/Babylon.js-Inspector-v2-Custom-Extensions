import { Scene } from "@babylonjs/core";
import {
  ShellServiceIdentity,
  IShellService,
  SceneContextIdentity,
  ISceneContext,
  ServiceDefinition,
  useObservableState,
} from "@babylonjs/inspector";
import { type FunctionComponent, useState, useEffect } from "react";
import { Badge } from "@fluentui/react-components";

export // First we need to configure a ServiceDefinition.
const MemoryCounterServiceDefinition: ServiceDefinition<
  [],
  // We consume IShellService so we can add a new side pane,
  // and also ISceneContext to get access to the current scene.
  // These are the service contracts (an interface) and are used at compile time.
  [IShellService, ISceneContext]
> = {
  friendlyName: "Memory Counter",
  // These are consumed service identities and are used at runtime.
  consumes: [ShellServiceIdentity, SceneContextIdentity],
  // This factory function creates the instance of the service.
  // It is effectively called when ShowInspector is called.
  factory: (shellService: IShellService, sceneContext: ISceneContext) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const MemoryCounter: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
      const [memoryUsage, setMemoryUsage] = useState<{ bytes: number; source: string }>({
        bytes: 0,
        source: "unavailable",
      });

      const getMemoryUsage = () => {
        if ("memory" in performance) {
          return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            bytes: (performance as any).memory.usedJSHeapSize,
            source: "legacy",
          };
        }
        // No memory data available
        return {
          bytes: 0,
          source: "unavailable",
        };
      };

      // Poll memory usage every 500ms
      useEffect(() => {
        const interval = setInterval(() => {
          setMemoryUsage(getMemoryUsage());
        }, 500);

        return () => clearInterval(interval);
      }, []);

      return (
        <Badge
          style={{ alignSelf: "center" }}
          size="medium"
          appearance="tint"
          color={memoryUsage.source == "unavailable" ? "danger" : "success"}
        >
          {"Memory: " + (Math.round(memoryUsage.bytes / 1024) / 1024).toFixed(0) + " Mb"}
        </Badge>
      );
    };

    const MemoryCounterContainer: FunctionComponent = () => {
      // Create a scene state that updates whenever the current scene updates.
      const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
      // Render the MemoryCounter, but only if we have a current scene.
      return scene ? <MemoryCounter scene={scene} /> : null;
    };

    const toolbarItemRegistration = shellService.addToolbarItem({
      key: "Memory Counter",
      horizontalLocation: "left",
      verticalLocation: "bottom",
      teachingMoment: {
        title: "Memory Counter",
        description: "This footer indicator shows approximate JavaScript heap usage for the current Inspector session.",
      },
      // This is the React component that will be rendered in the toolbar.
      component: MemoryCounterContainer,
    });

    return toolbarItemRegistration;
  },
};
