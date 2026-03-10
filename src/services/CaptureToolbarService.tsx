import { Scene } from "@babylonjs/core";
import {
  ShellServiceIdentity,
  IShellService,
  SceneContextIdentity,
  ISceneContext,
  ServiceDefinition,
  useObservableState,
} from "@babylonjs/inspector";
import { type FunctionComponent, useState, useCallback } from "react";
import { Button } from "@fluentui/react-components";
import { CameraRegular, SaveRegular, DeleteRegular } from "@fluentui/react-icons";
import { Tools } from "@babylonjs/core/Misc/tools";
import { FrameGraphUtils } from "@babylonjs/core/FrameGraph/frameGraphUtils";

export const CaptureToolbarServiceDefinition: ServiceDefinition<
  [],
  [IShellService, ISceneContext]
> = {
  friendlyName: "Capture Toolbar",
  consumes: [ShellServiceIdentity, SceneContextIdentity],
  factory: (shellService: IShellService, sceneContext: ISceneContext) => {
    const CaptureButton: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
      const [screenshotData, setScreenshotData] = useState<string | null>(null);

      const captureScreenshot = useCallback(() => {
        const camera = scene.frameGraph ? FrameGraphUtils.FindMainCamera(scene.frameGraph) : scene.activeCamera;
        if (camera) {
          // Capture screenshot and get the data URL
          Tools.CreateScreenshot(
            scene.getEngine(),
            camera,
            { precision: 1 },
            (data) => {
              setScreenshotData(data);
            }
          );
        }
      }, [scene]);

      const saveScreenshot = useCallback(() => {
        if (screenshotData) {
          // Create a download link
          const link = document.createElement("a");
          link.href = screenshotData;
          link.download = `screenshot_${Date.now()}.png`;
          link.click();
        }
      }, [screenshotData]);

      const deleteScreenshot = useCallback(() => {
        setScreenshotData(null);
      }, []);

      return (
        <>
          <Button
            appearance="secondary"
            icon={<CameraRegular />}
            onClick={captureScreenshot}
            style={{ alignSelf: "center" }}
          >
            Capture
          </Button>

          {screenshotData && (
            <div
              style={{
                position: "fixed",
                left: "12px",
                bottom: "52px", // 40px toolbar + 12px gap
                width: "200px",
                height: "150px",
                border: "2px solid #444",
                borderRadius: "4px",
                overflow: "hidden",
                backgroundColor: "#1e1e1e",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                zIndex: 1000,
              }}
            >
              <img
                src={screenshotData}
                alt="Screenshot"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  display: "flex",
                  gap: "4px",
                }}
              >
                <Button
                  appearance="primary"
                  icon={<SaveRegular />}
                  onClick={saveScreenshot}
                  size="small"
                  title="Save Screenshot"
                  style={{
                    minWidth: "32px",
                    padding: "4px",
                  }}
                />
                <Button
                  appearance="secondary"
                  icon={<DeleteRegular />}
                  onClick={deleteScreenshot}
                  size="small"
                  title="Delete Screenshot"
                  style={{
                    minWidth: "32px",
                    padding: "4px",
                  }}
                />
              </div>
            </div>
          )}
        </>
      );
    };

    const CaptureButtonContainer: FunctionComponent = () => {
      const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
      return scene ? <CaptureButton scene={scene} /> : null;
    };

    const toolbarItemRegistration = shellService.addToolbarItem({
      key: "Capture Toolbar",
      horizontalLocation: "left",
      verticalLocation: "bottom",
      teachingMoment: {
        title: "Capture",
        description: "Capture a screenshot of the current view and then save or discard it from the preview.",
      },
      component: CaptureButtonContainer,
    });

    return toolbarItemRegistration;
  },
};

export default {
  serviceDefinitions: [CaptureToolbarServiceDefinition],
} as const;

