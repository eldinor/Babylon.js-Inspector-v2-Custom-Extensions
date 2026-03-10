import { BuiltInExtension, BuiltInsExtensionFeed, ExtensionMetadata } from "@babylonjs/inspector";

const BabylonPressResources = {
  homepage: "https://inspector.babylonpress.org/",
  repository: "https://github.com/eldinor/Babylon.js-Inspector-v2-Custom-Extensions",
  bugs: "https://github.com/eldinor/Babylon.js-Inspector-v2-Custom-Extensions/issues",
  author: { name: "Andrei Stepanov", forumUserName: "labris", url: "https://babylonpress.org" },
  license: "Apache 2.0",
} as const satisfies Partial<ExtensionMetadata>;

const graphicsBudgetExtension = {
  name: "Graphics Budget",
  description: "Provides graphics budget settings and UI to surface warnings when the thresholds are exceeded.",
  keywords: ["graphics", "budget", "indicator", "toolbar"],
  homepage: "https://doc.babylonjs.com/toolsAndResources/inspectorv2/examples/#dynamic-extensions",
  author: { name: "Ryan Tremblay", forumUserName: "ryantrem" },
  contributors: [{ name: "Andrei Stepanov", forumUserName: "labris", url: "https://babylonpress.org" }],

  getExtensionModuleAsync: async () => import("../services/graphicsBudgetService"),
};

const importGLBExtension = {
  name: "Import GLB",
  description: "Provides a tool to import GLB files into the scene and then clone, instance and manipulate them. TOOLS Section",
  keywords: ["import", "glb", "tools"],
  ...BabylonPressResources,
  getExtensionModuleAsync: async () => import("../services/ImportGLBService"),
};

const disposeByTypeExtension = {
  name: "Dispose By Type [Experimental]",
  description: "Provides a tool to dispose scene objects by type (lights, meshes, materials, textures, etc.) with batch selection. SCENE EXPLORER Section",
  keywords: ["dispose", "cleanup", "tools", "batch"],
  ...BabylonPressResources,
  getExtensionModuleAsync: async () => import("../services/DisposeByTypeService"),
};

const captureToolbarExtension = {
  name: "Capture Toolbar",
  description: "Provides a capture button in the toolbar to take screenshots with save and delete options.",
  keywords: ["capture", "screenshot", "toolbar", "image"],
  ...BabylonPressResources,
  getExtensionModuleAsync: async () => import("../services/CaptureToolbarService"),
};

  const extensions = [
    graphicsBudgetExtension,
    importGLBExtension,
    disposeByTypeExtension,
    captureToolbarExtension
  ];

const getExtensionList  = (extensions) => {
  return extensions.map((extension: BuiltInExtension) => {
    return new BuiltInsExtensionFeed(extension.name, [extension])
  })
}

// BuiltInsExtensionFeed has the feed descriptions private. This function populates the new object to use in InfoService.
const getExtensionMetadata = (extensions) => {
  return extensions.map(extension => ({
    feedName: extension.name,
    name: extension.name,
    description: extension.description
  }));
};

export const extensionList = getExtensionList(extensions)
export const extensionMetadata = getExtensionMetadata(extensions);
