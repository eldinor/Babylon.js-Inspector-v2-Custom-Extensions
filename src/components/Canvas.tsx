import { useEffect, useRef } from "react";
import {
  Engine,
  Scene,
  LoadAssetContainerAsync,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  ArcRotateCamera,
  Tools,
  CubeTexture,
  PBRMaterial,
  ReflectionProbe,
  Mesh,
  GroundMesh,
  Color3,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { ShowInspector, BuiltInsExtensionFeed } from "@babylonjs/inspector";
import { serviceList } from "../services/ServiceList";
import { extensionList } from "../services/ExtensionList";

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const enabledServices = serviceList;

  // Initialize scene only once
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create Babylon.js engine
    const engine = new Engine(canvasRef.current, true, {
      adaptToDeviceRatio: true,
      antialias: true,
    });

    // Create scene
    const scene = new Scene(engine);
    sceneRef.current = scene;
    // scene.clearColor.set(0.1, 0.1, 0.1, 1);

    // Create default camera and light
    const camera = new ArcRotateCamera("camera", Tools.ToRadians(60), Tools.ToRadians(57.3), 10, Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);
    camera.setTarget(Vector3.Zero());
    camera.wheelDeltaPercentage = 0.01;

    (async () => {
      // Add a hemispheric light
      const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
      light.intensity = 0.7;
      // --- Environment Reflection ---
      const hdrTexture = new CubeTexture("/environmentSpecular.env", scene);
      scene.environmentTexture = hdrTexture;

      // Create a simple box mesh
      const box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
      box.position.x = -2;
      box.position.y = 1;

      const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1.5, segments: 32 }, scene);
      sphere.position.y = 1;
      sphere.position.z = -2;

      const capsule = MeshBuilder.CreateCapsule("capsule", { height: 2, radius: 0.5, tessellation: 16 }, scene);
      capsule.position.y = 1;
      capsule.position.x = 2;

      // Create a ground plane
      const ground = MeshBuilder.CreateGround("ground", { width: 15, height: 15 }, scene);

      const testAsset = "https://assets.babylonjs.com/meshes/Demos/optimized/acrobaticPlane_variants.glb";

      const assetContainer = await LoadAssetContainerAsync(testAsset, scene);
      assetContainer.addAllToScene();
      assetContainer.meshes[0].position.y = 1;
      assetContainer.meshes[0].scaling.scaleInPlace(5);
      assetContainer.animationGroups[0].stop();
      assetContainer.animationGroups[2].play(true);

      const bmat = new PBRMaterial("bm");
      bmat.albedoColor = Color3.Red();
      bmat.roughness = 0.25;
      bmat.metallic = 1.0;
      box.material = bmat;

      const spmat = new PBRMaterial("spmat", scene);
      spmat.roughness = 0.25;
      spmat.metallic = 1.0;
      sphere.material = spmat;

      const capmat = new PBRMaterial("capmat", scene);
      capmat.roughness = 0.25;
      capmat.metallic = 1.0;
      capmat.albedoColor = Color3.Blue();
      capsule.material = capmat;

      const grmat = new PBRMaterial("grmat", scene);
      grmat.roughness = 0.1;
      grmat.metallic = 0.9;
      ground.material = grmat;

      const skybox = scene.createDefaultSkybox(hdrTexture, true, 10000, 0.5);

      const probe = new ReflectionProbe("main", 512, scene);
      probe.metadata = {"About": "This is testing Reflection Probe!"}
      probe.renderList!.push(box);
      probe.renderList!.push(skybox as Mesh);

      console.log(scene.getMeshByName("aerobatic_plane.2"));
      probe.renderList!.push(scene.getMeshByName("aerobatic_plane.2") as Mesh);

      //  probe.attachToMesh(sphere)

      spmat.reflectionTexture = probe.cubeTexture;
      grmat.reflectionTexture = probe.cubeTexture;

      console.log(scene.reflectionProbes);
      console.log(scene.reflectionProbes[0].renderList);

      scene.registerBeforeRender(function () {
        box.rotation.y += 0.01;
      });
    })();

    // Defer Inspector update to avoid race condition during render
    setTimeout(() => {
      ShowInspector(sceneRef.current!, {
        //  initialTab: 2,
        //   showExplorer:false,
        layoutMode: "overlay",
        serviceDefinitions: enabledServices,
        extensionFeeds: extensionList,
      });
    }, 100);

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      scene.dispose();
      engine.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="renderCanvas"
      style={{
        display: "block",
        width: "100%",
        height: "100vh",
        margin: 0,
        padding: 0,
        outline: "none",
      }}
    />
  );
}
