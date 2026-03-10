import { Scene } from "@babylonjs/core";
import {
  Button,
  ShellServiceIdentity,
  type IShellService,
  SceneContextIdentity,
  type ISceneContext,
  type ISelectionService,
  SelectionServiceIdentity,
  useObservableState,
  useSetting,
  useTheme,
  type ServiceDefinition,
} from "@babylonjs/inspector";
import { type FunctionComponent } from "react";
import { Info16Regular, InfoRegular } from "@fluentui/react-icons";
import { serviceList } from "./ServiceList";
import { Tooltip } from "@fluentui/react-components";
import { extensionMetadata } from "./ExtensionList";

const teachingMomentKeyByName: Record<string, string> = {
  "Vertex Tree Map": "TeachingMoments/Pane/right/Vertex Tree Map",
  "Memory Counter": "TeachingMoments/Bar/bottom/left/Memory Counter",
  Info: "TeachingMoments/Pane/right/Inspector v2 Custom Extensions Info",
  "BabylonPress Logo": "TeachingMoments/Bar/bottom/right/BabylonPress Logo",
  "Graphics Budget": "TeachingMoments/Bar/bottom/right/Draw Calls Counter",
  "Import GLB": "TeachingMoments/Pane/right/Import GLB",
  "Capture Toolbar": "TeachingMoments/Bar/bottom/left/Capture Toolbar",
};

const serviceDescriptionByName: Record<string, string> = {
  "Reflection Probes": "Manage probe render lists and inspect which meshes and materials are linked to each reflection probe. SCENE EXPLORER Section",
};

export const InfoServiceDefinition: ServiceDefinition<
  [],
  [IShellService, ISceneContext, ISelectionService]
> = {
  friendlyName: "Info",
  consumes: [ShellServiceIdentity, SceneContextIdentity, SelectionServiceIdentity],
  factory: (shellService, sceneContext) => {
    const TeachingInfoIcon: FunctionComponent<{
      name: string;
      description: string;
      color: string;
    }> = ({ name, description, color }) => {
      const teachingMomentKey = teachingMomentKeyByName[name];
      const [, setHasDisplayed] = useSetting({
        key: teachingMomentKey ?? `InfoTooltip/${name}`,
        defaultValue: false,
      });

      const icon = (
        <span
          onClick={() => {
            if (teachingMomentKey) {
              setHasDisplayed(false);
            }
          }}
          style={{ display: "inline-flex", cursor: "help", color }}
        >
          <Info16Regular />
        </span>
      );

      if (teachingMomentKey) {
        return icon;
      }

      return (
        <Tooltip content={description} relationship="description">
          {icon}
        </Tooltip>
      );
    };

    const Info: FunctionComponent<{ scene: Scene }> = ({ scene: _scene }) => {
      const theme = useTheme();
      const rowStyle = {
        padding: "6px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        borderRadius: "4px",
        background: theme.colorNeutralBackground2,
        border: `1px solid ${theme.colorNeutralStroke2}`,
      } as const;

      return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "12px" }}>
          <h3 style={{ margin: 0, color: theme.colorNeutralForeground1 }}>Custom ServiceDefinitions</h3>
          <ul style={{ listStyleType: "none", paddingLeft: 0, marginTop: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {serviceList.map((service, index) => (
              <li key={index} style={rowStyle}>
                <span style={{ color: theme.colorNeutralForeground1 }}>{service.friendlyName}</span>
                <TeachingInfoIcon
                  name={service.friendlyName}
                  description={
                    serviceDescriptionByName[service.friendlyName] ??
                    `Service definition for ${service.friendlyName}`
                  }
                  color={theme.colorNeutralForeground3}
                />
              </li>
            ))}
          </ul>
          <h3 style={{ margin: 0, color: theme.colorNeutralForeground1 }}>Custom ExtensionFeeds</h3>
          <ul style={{ listStyleType: "none", paddingLeft: 0, marginTop: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {extensionMetadata.map((extension, index) => (
              <li key={index} style={rowStyle}>
                <span style={{ color: theme.colorNeutralForeground1 }}>{extension.name}</span>
                <TeachingInfoIcon
                  name={extension.name}
                  description={extension.description}
                  color={theme.colorNeutralForeground3}
                />
              </li>
            ))}
          </ul>
          <h3 style={{ margin: 0, color: theme.colorNeutralForeground1 }}>Documentation</h3>
          <div style={{ ...rowStyle, marginTop: "4px", flexDirection: "column", alignItems: "flex-start" }}>
            <Button
              appearance="secondary"
              label="Open Readme"
              onClick={() => {
                window.open(
                  "https://github.com/eldinor/Babylon.js-Inspector-v2-Custom-Extensions#readme",
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            />
          </div>
        </div>
      );
    };

    const sidePaneRegistration = shellService.addSidePane({
      key: "Info",
      title: "Inspector v2 Custom Extensions Info",
      order: 400,
      icon: InfoRegular,
      horizontalLocation: "right",
      verticalLocation: "top",
      teachingMoment: {
        title: "Custom Extensions Info",
        description: "Browse the registered custom services and extension feeds from this pane.",
      },
      content: () => {
        const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);

        return scene ? <Info scene={scene} /> : null;
      },
    });

    return {
      dispose: () => {
        sidePaneRegistration.dispose();
      },
    };
  },
};
