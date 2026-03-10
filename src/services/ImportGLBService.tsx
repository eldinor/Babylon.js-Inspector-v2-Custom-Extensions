import { ArrowUploadRegular } from "@fluentui/react-icons";
import type { FunctionComponent } from "react";
import type { Scene } from "@babylonjs/core";
import {
  ShellServiceIdentity,
  type IShellService,
  SceneContextIdentity,
  type ISceneContext,
  type ISelectionService,
  SelectionServiceIdentity,
  useObservableState,
  type ServiceDefinition,
} from "@babylonjs/inspector";
import { ImportGLBTools } from "./ImportGLB";

export const GLBImportServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext, ISelectionService]> = {
  friendlyName: "Import GLB Tool",
  consumes: [ShellServiceIdentity, SceneContextIdentity, SelectionServiceIdentity],
  factory: (shellService, sceneContext, selectionService) => {
    const ImportGLBPane: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
      return <ImportGLBTools scene={scene} selectionService={selectionService} />;
    };

    const sidePaneRegistration = shellService.addSidePane({
      key: "GLB Import",
      title: "Import GLB",
      order: 425,
      icon: ArrowUploadRegular,
      horizontalLocation: "right",
      verticalLocation: "top",
      keepMounted: true,
      teachingMoment: {
        title: "Import GLB",
        description: "Import GLB files and manage clones and instances from this pane.",
      },
      content: () => {
        const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

        return scene ? <ImportGLBPane scene={scene} /> : null;
      },
    });

    return {
      dispose: () => {
        sidePaneRegistration.dispose();
      },
    };
  },
};

export default {
  serviceDefinitions: [GLBImportServiceDefinition],
} as const;
