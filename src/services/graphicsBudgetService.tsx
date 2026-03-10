/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react-refresh/only-export-components */
import { Observable, Scene, SceneInstrumentation } from "@babylonjs/core";
import {
  IShellService,
  ShellServiceIdentity,
  ISceneContext,
  SceneContextIdentity,
  ISettingsService,
  SettingsServiceIdentity,
  useResource,
  usePollingObservable,
  useObservableState,
  IService,
  TextInputPropertyLine,
  ServiceDefinition,
} from "@babylonjs/inspector";
import { FunctionComponent, useCallback } from "react";
import { Badge } from "@fluentui/react-components";

// This is the runtime identity for the new "Graphics Service.""
export const GraphicsBudgetServiceIdentity = Symbol("GraphicsBudgetService");

// This is the service contract (interface) for the "Graphics Service."
// It defines the functionality available to other services that consume it.
export interface IGraphicsBudgetService
  extends IService<typeof GraphicsBudgetServiceIdentity> {
  readonly changedObservable: Observable<void>;
  readonly drawCallWarningThreshold: number;
  readonly drawCallDangerThreshold: number;
}

// Now we can define the new "Graphics Service."
// eslint-disable-next-line react-refresh/only-export-components
export const GraphicsBudgetServiceDefinition: ServiceDefinition<
  // It produces the IGraphicsBudgetService, which other services can consume.
  [IGraphicsBudgetService],
  // It consumes the ISettingsService so that it can add some settings for the draw call thresholds.
  // You could imagine it could contain many more graphics budget related settings.
  [ISettingsService]
> = {
  friendlyName: "Graphics Budget Settings",
  consumes: [SettingsServiceIdentity],
  produces: [GraphicsBudgetServiceIdentity],
  factory: (settingsService) => {
    // Some default values (you could imagine storing these in localStorage).
    let _drawCallWarningThreshold = 50;
    let _drawCallDangerThreshold = 100;
    const _changedObservable = new Observable<void>();

    // Just a helper function that updates the value and fires the observable.
    const updateDrawCallsWarningThreshold = (value: number) => {
      _drawCallWarningThreshold = value;
      _changedObservable.notifyObservers();
    };

    // Just a helper function that updates the value and fires the observable.
    const updateDrawCallsDangerThreshold = (value: number) => {
      _drawCallDangerThreshold = value;
      _changedObservable.notifyObservers();
    };

    // This adds a new section to the Settings pane.
    const settingsSectionRegistration = settingsService.addSectionContent({
      key: "Graphics Budget",
      section: "Graphics Budget",
      component: () => {
        // Watch for changes to the warning threshold and re-render the React component when it changes.
        const drawCallWarningThreshold = useObservableState(
          () => _drawCallWarningThreshold,
          _changedObservable
        );

        // Watch for changes to the danger threshold and re-render the React component when it changes.
        const drawCallDangerThreshold = useObservableState(
          () => _drawCallDangerThreshold,
          _changedObservable
        );

        return (
          <>
            <TextInputPropertyLine
              label="Draw Call Warning"
              description="The threshold for number of draw calls to be considered at warning level."
              value={drawCallWarningThreshold.toString()}
              onChange={(newValue) => updateDrawCallsWarningThreshold(newValue as never)}
            />
            <TextInputPropertyLine
              label="Draw Call Danger"
              description="The threshold for number of draw calls to be considered at danger level."
              value={drawCallDangerThreshold.toString()}
              onChange={(newValue) => updateDrawCallsDangerThreshold(newValue as never)}
            />
          </>
        );
      },
    });

    // We return an object that implements the IGraphicsBudgetService interface,
    // and also includes a dispose function that removes the section added to the Settings pane.
    return {
      get drawCallWarningThreshold() {
        return _drawCallWarningThreshold;
      },
      get drawCallDangerThreshold() {
        return _drawCallDangerThreshold;
      },
      changedObservable: _changedObservable,
      dispose: () => {
        settingsSectionRegistration.dispose();
      },
    };
  },
};

// Then we need to configure a ServiceDefinition for displaying the draw call count.
export const DrawCallsServiceDefinition: ServiceDefinition<
  [],
  // We consume IShellService so we can add a new side pane,
  // and also ISceneContext to get access to the current scene.
  // These are the service contracts (an interface) and are used at compile time.
  [IShellService, ISceneContext, IGraphicsBudgetService]
> = {
  friendlyName: "Draw Calls Counter",
  // These are consumed service identities and are used at runtime.
  consumes: [
    ShellServiceIdentity,
    SceneContextIdentity,
    GraphicsBudgetServiceIdentity,
  ],
  // This factory function creates the instance of the service.
  // It is effectively called when ShowInspector is called.
  factory: (shellService, sceneContext, graphicsBudgeService) => {
    const DrawCallCounter: FunctionComponent<{ scene: Scene }> = ({
      scene,
    }) => {
      // Create a SceneInstrumentation instance.
      // useResource will ensure it is disposed when the component unmounts.
      const sceneInstrumentation = useResource(
        useCallback(() => new SceneInstrumentation(scene), [scene])
      );

      // Create a polling observable that will fire every 250ms.
      const pollingObservable = usePollingObservable(250);

      // Get the warning threshold from the graphics budget service.
      const drawCallWarningThreshold = useObservableState(
        () => graphicsBudgeService.drawCallWarningThreshold,
        graphicsBudgeService.changedObservable
      );

      // Get the danger threshold from the graphics budget service.
      const drawCallDangerThreshold = useObservableState(
        () => graphicsBudgeService.drawCallDangerThreshold,
        graphicsBudgeService.changedObservable
      );

      // Create a drawCalls count state that updates every time the polling observable fires (every 250ms).
      const drawCalls = useObservableState(
        () => sceneInstrumentation.drawCallsCounter.current,
        pollingObservable
      );

      return (
        <Badge
          title="Draw Calls"
          style={{ alignSelf: "center" }}
          size="medium"
          appearance="filled"
          color={
            drawCalls > drawCallDangerThreshold
              ? "danger"
              : drawCalls > drawCallWarningThreshold
              ? "warning"
              : "success"
          }
        >
          {drawCalls}
        </Badge>
      );
    };

   
    const toolbarItemRegistration = shellService.addToolbarItem({
      key: "Draw Calls Counter",
      order: 2000,
      horizontalLocation: "right",
      verticalLocation: "bottom",
      teachingMoment: {
        title: "Draw Calls",
        description: "This footer indicator shows the current scene draw-call count and changes color at warning thresholds.",
      },
      // This is the React component that will be rendered in the side pane.
      component: () => {
        // Create a scene state that updates whenever the current scene updates.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const scene = useObservableState(
          () => sceneContext.currentScene,
          sceneContext.currentSceneObservable
        );
        // Render the DrawCallCounter, but only if we have a current scene.
        return scene ? <DrawCallCounter scene={scene} /> : null;
      },
    });

    return toolbarItemRegistration;
  },
};

export default {
  serviceDefinitions: [
    GraphicsBudgetServiceDefinition,
    DrawCallsServiceDefinition,
  ],
} as const;
