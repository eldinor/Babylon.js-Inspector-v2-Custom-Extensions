# Babylon.js Inspector v2 Custom Extensions

A collection of custom `ServiceDefinitions` and `ExtensionFeeds` for Babylon.js Inspector v2, built with React, TypeScript, and Vite.

Live demo:

- [https://inspector.babylonpress.org/](https://inspector.babylonpress.org/)

## Stack

- Babylon.js `8.54.1`
- Babylon.js Inspector `8.54.1`
- React `19`
- TypeScript
- Vite

## Getting Started

Prerequisites:

- Node.js `18+`
- npm

Install dependencies:

```bash
npm install
```

Start development mode:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

Run lint:

```bash
npm run lint
```

## Important Note About Extensions

Custom extension feeds are not active just because they exist in the project.

They must be installed from the Inspector Extensions UI before they appear and become usable.

In this project, that applies to:

- `Graphics Budget`
- `Import GLB`
- `Dispose By Type [Experimental]`
- `Capture Toolbar`

Custom service definitions are registered directly by the app and do not go through the extension-install flow.

## How to Add Extensions to Your Setup

If you are using this project inside Inspector v2, custom extension feeds must be installed from the Extensions UI before they become available.

Steps:

1. Open the Inspector.
2. Click the `Extensions` button in the top-right toolbar.
3. Find the extension you want in the list.
4. Click `Get` to install it.
5. Wait for the install to complete.
6. Open the related pane, tool, toolbar item, or settings section.

Extensions in this project that use this flow:

- `Graphics Budget`
- `Import GLB`
- `Dispose By Type [Experimental]`
- `Capture Toolbar`

If an extension does not appear after installation, close and reopen the related Inspector area first, then verify that the extension is listed as installed.

## How to Use These Extensions in Your Copy of Inspector

If you want these extensions in your own Babylon.js Inspector integration, you need to do two things:

1. Register the custom service definitions in your Inspector setup.
2. Register the custom extension feeds so they appear in the Extensions UI and can be installed.

### 1. Copy the service and extension files

Bring these files into your project:

- `src/services/ServiceList.tsx`
- `src/services/ExtensionList.tsx`
- the service files referenced by those registries

At minimum, that includes files such as:

- `InfoService.tsx`
- `ProbeService.tsx`
- `VertexTreeMapService.tsx`
- `MemoryCounterToolbarService.tsx`
- `graphicsBudgetService.tsx`
- `ImportGLBService.tsx`
- `ImportGLB.tsx`
- `DisposeByTypeService.tsx`
- `DisposeByType.tsx`
- `CaptureToolbarService.tsx`
- `LogoService.tsx`

### 2. Register custom ServiceDefinitions

Where you call `ShowInspector(...)`, include the custom service definitions from `ServiceList.tsx`.

Conceptually:

```ts
ShowInspector(scene, {
  serviceDefinitions: [
    ...serviceList,
  ],
});
```

This makes direct custom services available immediately in the Inspector.

### 3. Register custom ExtensionFeeds

Also pass the extension feeds from `ExtensionList.tsx` into your Inspector setup.

Conceptually:

```ts
ShowInspector(scene, {
  extensionFeeds: [
    ...extensionList,
  ],
});
```

This makes the extensions discoverable from the Inspector Extensions UI.

### 4. Install the extensions from the Inspector UI

After the feeds are registered:

1. Open the Inspector.
2. Open the `Extensions` button in the top-right toolbar.
3. Find the extension you want.
4. Click `Get`.
5. Wait for the installation to finish.

Only after installation will those extension-based features appear in the Inspector.

### 5. Verify dependent assets and packages

Your project also needs the same runtime dependencies used by these extensions, especially:

- `@babylonjs/inspector`
- `@babylonjs/core`
- `@babylonjs/loaders`
- `@babylonjs/materials`
- `@babylonjs/serializers`
- `@fluentui/react-icons`
- `echarts-for-react`

If you use the BabylonPress logo entry, also copy:

- `public/bplogo.svg`

### Practical Summary

To use these extensions in your own Inspector copy:

1. Copy the service files.
2. Import and pass `serviceList` to Inspector setup.
3. Import and pass `extensionList` to Inspector setup.
4. Open Inspector and install the extension-feed items from the Extensions UI.

## Where Features Appear

### Right Side Pane

- `Inspector v2 Custom Extensions Info`
- `Import GLB`
- `Vertex Tree Map`

### Footer Toolbar

- `Capture Toolbar`
- `Memory Counter`
- `Graphics Budget` draw-call indicator
- `BabylonPress Logo`

### Scene Explorer

- `Reflection Probes`

### Tools

- `Dispose By Type [Experimental]`

### Settings

- `Graphics Budget`

## User Guide

### Inspector v2 Custom Extensions Info

Location:

- Right side pane

Purpose:

- Lists registered custom service definitions and extension feeds
- Provides quick descriptions for each item

Notes:

- If an item has a real Inspector anchor such as a side-pane tab or toolbar item, its help icon can re-trigger the native Inspector teaching moment
- Otherwise the help icon falls back to a tooltip

### Import GLB

Location:

- Right side pane

Purpose:

- Import `.glb` files into the scene
- Create clones and instances
- Dispose imported entries

Typical workflow:

1. Install the extension from the Inspector Extensions UI.
2. Open the `Import GLB` pane.
3. Upload one or more `.glb` files.
4. Expand an imported entry if needed.
5. Create a clone or instance.
6. Remove entries you no longer need.

Notes:

- Imported entries stay in the pane when switching tabs because the pane is kept mounted
- Clone and instance rows use Inspector-aligned icons and theme colors

### Vertex Tree Map

Location:

- Right side pane

Purpose:

- Visualize mesh vertex cost as a treemap
- Identify heavy meshes quickly

How to use:

1. Open `Vertex Tree Map`.
2. Look for the largest blocks.
3. Click a block to select the matching mesh in the scene.

Best for:

- Geometry budget review
- Fast hotspot identification

### Reflection Probes

Location:

- Scene Explorer

Purpose:

- Inspect scene reflection probes
- Manage probe render lists
- See which materials reflect a probe
- Add or remove meshes and materials linked to a probe

How to use:

1. Open the `Reflection Probes` section in Scene Explorer.
2. Select a probe.
3. Use the Properties area to review meshes, reflected materials, and available additions.
4. Use the inline add/remove icons to update probe bindings.

Notes:

- Rows were simplified to show entity names more clearly
- Re-adding a mesh after removal is supported

### Dispose By Type [Experimental]

Location:

- Tools

Purpose:

- Batch-dispose scene objects by category

Typical targets:

- Meshes
- Lights
- Materials
- Textures

Recommended workflow:

1. Install the extension from the Inspector Extensions UI.
2. Open `Dispose By Type [Experimental]`.
3. Select only the categories and entries you want to remove.
4. Dispose in small batches.

Notes:

- This tool changes the scene immediately
- It is experimental

### Capture Toolbar

Location:

- Footer toolbar

Purpose:

- Capture a screenshot of the active view
- Preview the result
- Save or delete the captured image

How to use:

1. Install the extension from the Inspector Extensions UI.
2. Click `Capture`.
3. Review the preview.
4. Save it or delete it.

### Memory Counter

Location:

- Footer toolbar

Purpose:

- Show approximate JavaScript heap usage

Notes:

- The reading depends on browser support
- If memory APIs are unavailable, the indicator falls back to an unavailable state

### Graphics Budget

Locations:

- Footer toolbar
- Settings

Purpose:

- Show current draw calls in the footer
- Warn when thresholds are exceeded

Indicator behavior:

- Green: below warning threshold
- Yellow: above warning threshold
- Red: above danger threshold

Configuration:

1. Install the extension from the Inspector Extensions UI.
2. Open Settings.
3. Find `Graphics Budget`.
4. Set `Draw Call Warning` and `Draw Call Danger`.

### BabylonPress Logo

Location:

- Footer toolbar

Purpose:

- Quick link to BabylonPress resources

## Teaching Moments and Tooltips

Native Inspector teaching moments are available for:

- Toolbar items
- Side-pane tabs

That means native anchored teaching moments work for:

- `Import GLB`
- `Info`
- `Vertex Tree Map`
- `Capture Toolbar`
- `Memory Counter`
- `Graphics Budget`
- `BabylonPress Logo`

Scene Explorer sections and Tools do not currently expose the same native teaching-moment registration path in this project, so they use standard descriptions instead.

## Project Structure

```text
src/
  components/
    Canvas.tsx
  services/
    ServiceList.tsx
    ExtensionList.tsx
    InfoService.tsx
    ProbeService.tsx
    VertexTreeMapService.tsx
    MemoryCounterToolbarService.tsx
    graphicsBudgetService.tsx
    ImportGLB.tsx
    ImportGLBService.tsx
    DisposeByType.tsx
    DisposeByTypeService.tsx
    CaptureToolbarService.tsx
    LogoService.tsx
public/
  bplogo.svg
```

## Author

Andrei Stepanov (`labris`)

- [https://babylonpress.org/](https://babylonpress.org/)
- [https://github.com/eldinor](https://github.com/eldinor)

## Links

- Babylon.js Inspector v2 docs: [https://doc.babylonjs.com/toolsAndResources/inspectorv2](https://doc.babylonjs.com/toolsAndResources/inspectorv2)
- Babylon.js docs: [https://doc.babylonjs.com/](https://doc.babylonjs.com/)
- Project issues: [https://github.com/eldinor/Babylon.js-Inspector-v2-Custom-Extensions/issues](https://github.com/eldinor/Babylon.js-Inspector-v2-Custom-Extensions/issues)

## License

Apache License 2.0. See [LICENSE](LICENSE).
