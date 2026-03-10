import { ShellServiceIdentity, IShellService, ServiceDefinition } from "@babylonjs/inspector";
import { type FunctionComponent } from "react";

export const LogoServiceDefinition: ServiceDefinition<[], [IShellService]> = {
  friendlyName: "BabylonPress Logo",
  consumes: [ShellServiceIdentity],
  factory: (shellService: IShellService) => {
    const Logo: FunctionComponent = () => {
      return (
        <a
          href="https://babylonpress.org/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 8px",
            cursor: "pointer",
          }}
          title="BabylonPress.org"
        >
          <img
            src="/bplogo.svg"
            alt="BabylonPress Logo"
            style={{
              height: "24px",
              width: "auto",
            }}
          />
        </a>
      );
    };

    const toolbarItemRegistration = shellService.addToolbarItem({
      key: "BabylonPress Logo",
      horizontalLocation: "right",
      verticalLocation: "bottom",
      teachingMoment: {
        title: "BabylonPress",
        description: "Open BabylonPress resources and project links from this footer shortcut.",
      },
      component: Logo,
    });

    return toolbarItemRegistration;
  },
};
