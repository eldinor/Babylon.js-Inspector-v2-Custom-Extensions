/**
 * DisposeByType.tsx
 *
 * SERVICE: Dispose By Type Tool
 *
 * FEATURES:
 * - Display counts of different scene object types (lights, meshes, materials, etc.)
 * - Checkboxes to select which types to dispose
 * - Batch disposal with confirmation
 * - Feedback message that auto-dismisses after 2 seconds
 *
 * USAGE:
 * - Check/uncheck types you want to dispose
 * - Click "Dispose" button to remove selected types
 * - View disposal confirmation message
 *
 * TECHNICAL NOTES:
 * - All checkboxes are checked by default
 * - Disposes objects by type from the scene
 * - Shows temporary feedback message for 2 seconds
 */

import { Scene } from "@babylonjs/core";
import { ISelectionService, MessageBar, useTheme } from "@babylonjs/inspector";
import { useState, useEffect } from "react";
import { Button, Checkbox, Badge } from "@fluentui/react-components";

interface DisposeByTypeToolsProps {
  scene: Scene;
  selectionService: ISelectionService;
}

interface TypeCounts {
  lights: number;
  transformNodes: number;
  meshes: number;
  skeletons: number;
  materials: number;
  materialsNonDisposable: number;
  textures: number;
  texturesNonDisposable: number;
  animationGroups: number;
  postProcesses: number;
  effectLayers: number;
  particleSystems: number;
}

interface CheckedState {
  lights: boolean;
  transformNodes: boolean;
  meshes: boolean;
  skeletons: boolean;
  materials: boolean;
  textures: boolean;
  animationGroups: boolean;
  postProcesses: boolean;
  effectLayers: boolean;
  particleSystems: boolean;
}

export function DisposeByTypeTools({ scene }: DisposeByTypeToolsProps) {
  const theme = useTheme();
  const [counts, setCounts] = useState<TypeCounts>({
    lights: 0,
    transformNodes: 0,
    meshes: 0,
    skeletons: 0,
    materials: 0,
    materialsNonDisposable: 0,
    textures: 0,
    texturesNonDisposable: 0,
    animationGroups: 0,
    postProcesses: 0,
    effectLayers: 0,
    particleSystems: 0,
  });

  const [checked, setChecked] = useState<CheckedState>({
    lights: true,
    transformNodes: true,
    meshes: true,
    skeletons: true,
    materials: true,
    textures: true,
    animationGroups: true,
    postProcesses: true,
    effectLayers: true,
    particleSystems: true,
  });

  const [invertSelection, setInvertSelection] = useState<boolean>(false);
  const [disposalMessage, setDisposalMessage] = useState<string>("");

  const labelRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap" as const,
    minHeight: "24px",
  };

  const panelStyle = {
    padding: "8px 12px 12px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  };

  // Update counts when scene changes
  useEffect(() => {
    const updateCounts = () => {
      // Count non-disposable textures
      let nonDisposableTexturesCount = 0;
      scene.textures.forEach((texture) => {
        const isInternalTexture =
          texture.isRenderTarget ||
          !texture.name ||
          texture.name.startsWith("_") ||
          texture.name.toLowerCase().includes("environment") ||
          texture.name.startsWith("data:") ||
          texture.name.toLowerCase().includes("bone");
        if (isInternalTexture) {
          nonDisposableTexturesCount++;
        }
      });

      // Count non-disposable materials (default material)
      let nonDisposableMaterialsCount = 0;
      scene.materials.forEach((material) => {
        const isDefaultMaterial =
          material.name.toLowerCase() === "default material" ||
          material.name.toLowerCase().includes("default");
        if (isDefaultMaterial) {
          nonDisposableMaterialsCount++;
        }
      });

      setCounts({
        lights: scene.lights.length,
        transformNodes: scene.transformNodes.length,
        meshes: scene.meshes.length,
        skeletons: scene.skeletons.length,
        materials: scene.materials.length,
        materialsNonDisposable: nonDisposableMaterialsCount,
        textures: scene.textures.length,
        texturesNonDisposable: nonDisposableTexturesCount,
        animationGroups: scene.animationGroups.length,
        postProcesses: scene.postProcesses.length,
        effectLayers: scene.effectLayers.length,
        particleSystems: scene.particleSystems.length,
      });
    };

    updateCounts();

    // Update counts periodically
    const interval = setInterval(updateCounts, 500);
    return () => clearInterval(interval);
  }, [scene]);

  const handleCheckboxChange = (type: keyof CheckedState, isChecked: boolean) => {
    setChecked((prev) => ({ ...prev, [type]: isChecked }));
  };

  const handleInvertSelection = (isChecked: boolean) => {
    setInvertSelection(isChecked);
    // Invert all checkboxes
    setChecked((prev) => ({
      lights: !prev.lights,
      transformNodes: !prev.transformNodes,
      meshes: !prev.meshes,
      skeletons: !prev.skeletons,
      materials: !prev.materials,
      textures: !prev.textures,
      animationGroups: !prev.animationGroups,
      postProcesses: !prev.postProcesses,
      effectLayers: !prev.effectLayers,
      particleSystems: !prev.particleSystems,
    }));
  };

  const handleDispose = () => {
    let disposedCount = 0;
    const disposedTypes: string[] = [];

    if (checked.lights && scene.lights.length > 0) {
      const count = scene.lights.length;
      scene.lights.slice().forEach((light) => light.dispose());
      disposedCount += count;
      disposedTypes.push(`${count} light(s)`);
    }

    if (checked.transformNodes && scene.transformNodes.length > 0) {
      const count = scene.transformNodes.length;
      scene.transformNodes.slice().forEach((node) => node.dispose());
      disposedCount += count;
      disposedTypes.push(`${count} transform node(s)`);
    }

    if (checked.meshes && scene.meshes.length > 0) {
      const count = scene.meshes.length;
      scene.meshes.slice().forEach((mesh) => mesh.dispose());
      disposedCount += count;
      disposedTypes.push(`${count} mesh(es)`);
    }

    if (checked.skeletons && scene.skeletons.length > 0) {
      const count = scene.skeletons.length;
      scene.skeletons.slice().forEach((skeleton) => skeleton.dispose());
      disposedCount += count;
      disposedTypes.push(`${count} skeleton(s)`);
    }

    if (checked.materials && scene.materials.length > 0) {
      let actualDisposedCount = 0;
      scene.materials.slice().forEach((material) => {
        // Skip default material
        const isDefaultMaterial =
          material.name.toLowerCase() === "default material" ||
          material.name.toLowerCase().includes("default");

        if (!isDefaultMaterial) {
          material.dispose();
          actualDisposedCount++;
        }
      });
      disposedCount += actualDisposedCount;
      if (actualDisposedCount > 0) {
        disposedTypes.push(`${actualDisposedCount} material(s)`);
      }
    }

    if (checked.textures && scene.textures.length > 0) {
      let actualDisposedCount = 0;
      // Dispose textures without forcing material disposal
      scene.textures.slice().forEach((texture) => {
        // Skip internal/system textures that would break rendering:
        // - Render targets (used by post-processes, mirrors, etc.)
        // - Textures without a name (usually internal/system textures)
        // - Textures with names starting with underscore (internal convention)
        // - Environment textures
        // - Data URLs (inline textures)
        // - Skeleton bone textures (used for skeletal animation)
        const isInternalTexture =
          texture.isRenderTarget ||
          !texture.name ||
          texture.name.startsWith("_") ||
          texture.name.toLowerCase().includes("environment") ||
          texture.name.startsWith("data:") ||
          texture.name.toLowerCase().includes("bone");

        if (!isInternalTexture) {
          texture.dispose();
          actualDisposedCount++;
        }
      });
      disposedCount += actualDisposedCount;
      if (actualDisposedCount > 0) {
        disposedTypes.push(`${actualDisposedCount} texture(s)`);
      }
    }

    if (checked.animationGroups && scene.animationGroups.length > 0) {
      const count = scene.animationGroups.length;
      // Stop and dispose animation groups, then remove from scene

      for (const group of scene.animationGroups) {
        group.stop();
        group.dispose();
      
      disposedCount += count;
      }
      disposedTypes.push(`${count} animation group(s)`);
    }

    if (checked.postProcesses && scene.postProcesses.length > 0) {
      const count = scene.postProcesses.length;
      scene.postProcesses.slice().forEach((pp) => pp.dispose());
      disposedCount += count;
      disposedTypes.push(`${count} post process(es)`);
    }

    if (checked.effectLayers && scene.effectLayers.length > 0) {
      const count = scene.effectLayers.length;
      scene.effectLayers.slice().forEach((layer) => layer.dispose());
      disposedCount += count;
      disposedTypes.push(`${count} effect layer(s)`);
    }

    if (checked.particleSystems && scene.particleSystems.length > 0) {
      const count = scene.particleSystems.length;
      scene.particleSystems.slice().forEach((ps) => ps.dispose());
      disposedCount += count;
      disposedTypes.push(`${count} particle system(s)`);
    }

    // Show disposal message
    if (disposedCount > 0) {
      setDisposalMessage(`Disposed: ${disposedTypes.join(", ")}`);
    } else {
      setDisposalMessage("Nothing to dispose");
    }

    // Clear message after 2 seconds
    setTimeout(() => {
      setDisposalMessage("");
    }, 3000);
  };

  return (
    <div style={panelStyle}>
      <h3 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600", color: theme.colorNeutralForeground1 }}>
        Dispose By Type
      </h3>

      <Checkbox
        checked={invertSelection}
        onChange={(_, data) => handleInvertSelection(data.checked as boolean)}
        label="Invert Selection"
        style={{ fontWeight: "600", marginBottom: "2px" }}
      />

      <Checkbox
        checked={checked.lights}
        onChange={(_, data) => handleCheckboxChange("lights", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Lights
            <Badge size="small" appearance="tint" color="informative">{counts.lights}</Badge>
          </div>
        }
      />

      <Checkbox
        checked={checked.transformNodes}
        onChange={(_, data) => handleCheckboxChange("transformNodes", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Transform Nodes
            <Badge size="small" appearance="tint" color="informative">{counts.transformNodes}</Badge>
          </div>
        }
      />

      <Checkbox
        checked={checked.meshes}
        onChange={(_, data) => handleCheckboxChange("meshes", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Meshes
            <Badge size="small" appearance="tint" color="informative">{counts.meshes}</Badge>
          </div>
        }
      />

      <Checkbox
        checked={checked.skeletons}
        onChange={(_, data) => handleCheckboxChange("skeletons", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Skeletons
            <Badge size="small" appearance="tint" color="informative">{counts.skeletons}</Badge>
          </div>
        }
      />

      <Checkbox
        checked={checked.materials}
        onChange={(_, data) => handleCheckboxChange("materials", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Materials
            <Badge size="small" appearance="tint" color="informative">{counts.materials}</Badge>
            {counts.materialsNonDisposable > 0 && (
              <Badge size="small" appearance="tint" color="warning">{counts.materialsNonDisposable} protected</Badge>
            )}
          </div>
        }
      />

      <Checkbox
        checked={checked.textures}
        onChange={(_, data) => handleCheckboxChange("textures", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Textures
            <Badge size="small" appearance="tint" color="informative">{counts.textures}</Badge>
            {counts.texturesNonDisposable > 0 && (
              <Badge size="small" appearance="tint" color="warning">{counts.texturesNonDisposable} protected</Badge>
            )}
          </div>
        }
      />

      <Checkbox
        checked={checked.animationGroups}
        onChange={(_, data) => handleCheckboxChange("animationGroups", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Animation Groups
            <Badge size="small" appearance="tint" color="informative">{counts.animationGroups}</Badge>
          </div>
        }
      />

      <Checkbox
        checked={checked.postProcesses}
        onChange={(_, data) => handleCheckboxChange("postProcesses", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Post Processes
            <Badge size="small" appearance="tint" color="informative">{counts.postProcesses}</Badge>
          </div>
        }
      />

      <Checkbox
        checked={checked.effectLayers}
        onChange={(_, data) => handleCheckboxChange("effectLayers", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Effect Layers
            <Badge size="small" appearance="tint" color="informative">{counts.effectLayers}</Badge>
          </div>
        }
      />

      <Checkbox
        checked={checked.particleSystems}
        onChange={(_, data) => handleCheckboxChange("particleSystems", data.checked as boolean)}
        label={
          <div style={labelRowStyle}>
            Particle Systems
            <Badge size="small" appearance="tint" color="informative">{counts.particleSystems}</Badge>
          </div>
        }
      />

      <Button appearance="primary" onClick={handleDispose} style={{ marginTop: "6px" }}>
        Dispose
      </Button>

      {disposalMessage && (
        <MessageBar title="Dispose By Type" message={disposalMessage} intent="info" />
      )}
    </div>
  );
}
