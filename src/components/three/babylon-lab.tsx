"use client";
import { useEffect, useRef, useState } from "react";
import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import { useWebGL } from "./webgl";
export default function BabylonLab() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const flexRef = useRef(0);
  const [flex, setFlex] = useState(0);
  const [failed, setFailed] = useState(false);
  const webgl = useWebGL();
  useEffect(() => {
    if (!webgl || failed || !canvas.current) return;
    let engine: Engine | undefined;
    let observer: ResizeObserver | undefined;
    let intersection: IntersectionObserver | undefined;
    let onScreen = true;
    let visibility: (() => void) | undefined;
    const element = canvas.current;
    const loss = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    try {
      engine = new Engine(element, false, {
        preserveDrawingBuffer: false,
        stencil: false,
      });
      engineRef.current = engine;
      engine.setHardwareScalingLevel(Math.max(1, window.devicePixelRatio));
      const scene = new Scene(engine);
      scene.clearColor.set(0.92, 0.925, 0.89, 1);
      const camera = new ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 2.6,
        7,
        Vector3.Zero(),
        scene,
      );
      camera.attachControl(element, true);
      camera.lowerRadiusLimit = 4;
      camera.upperRadiusLimit = 10;
      new HemisphericLight("light", new Vector3(0, 1, 0), scene);
      const segments: Array<{
        mesh: ReturnType<typeof MeshBuilder.CreateBox>;
        x: number;
      }> = [];
      for (let i = 0; i < 16; i++) {
        const x = (i - 7.5) * 0.22;
        for (let layer = 0; layer < 3; layer++) {
          const material = new StandardMaterial(`layer-${i}-${layer}`, scene);
          material.diffuseColor = Color3.FromHexString(
            ["#30372a", "#dce1c5", "#bdda75"][layer],
          );
          const mesh = MeshBuilder.CreateBox(
            `sole-${i}-${layer}`,
            { width: 0.21, height: [0.1, 0.3, 0.07][layer], depth: 0.92 },
            scene,
          );
          mesh.material = material;
          mesh.position.set(x, [-0.22, 0, 0.2][layer], 0);
          segments.push({ mesh, x });
        }
      }
      const render = () => {
        for (const item of segments) {
          const angle = Math.max(0, item.x) * flexRef.current * 0.012;
          item.mesh.position.y =
            Math.pow(Math.max(0, item.x), 2) * flexRef.current * 0.008 +
            Number(
              item.mesh.name.split("-").at(-1) === "0"
                ? -0.22
                : item.mesh.name.endsWith("-1")
                  ? 0
                  : 0.2,
            );
          item.mesh.rotation.z = angle;
        }
        scene.render();
      };
      engine.runRenderLoop(render);
      visibility = () => {
        if (document.hidden || !onScreen) engine?.stopRenderLoop(render);
        else engine?.runRenderLoop(render);
      };
      document.addEventListener("visibilitychange", visibility);
      intersection = new IntersectionObserver((entries) => {
        onScreen = entries[0]?.isIntersecting ?? false;
        visibility?.();
      });
      intersection.observe(element);
      observer = new ResizeObserver(() => engine?.resize());
      observer.observe(element);
      element.addEventListener("webglcontextlost", loss);
    } catch {
      queueMicrotask(() => setFailed(true));
    }
    return () => {
      observer?.disconnect();
      intersection?.disconnect();
      if (visibility)
        document.removeEventListener("visibilitychange", visibility);
      element.removeEventListener("webglcontextlost", loss);
      engine?.stopRenderLoop();
      engine?.dispose();
      engineRef.current = null;
    };
  }, [webgl, failed]);
  return (
    <div className="experience-layout">
      <div className="scene-window">
        {webgl && !failed ? (
          <canvas
            ref={canvas}
            aria-label="Interactive sole cross-section"
            className="engine-canvas"
          />
        ) : (
          <div className="sole-diagram">
            <div style={{ transform: `rotate(${-flex * 0.15}deg)` }}>
              FOOTBED
            </div>
            <div>MIDSOLE</div>
            <div>OUTSOLE</div>
            <p>2D cross-section / WebGL unavailable</p>
          </div>
        )}
      </div>
      <div className="viewer-controls">
        <span className="eyebrow">SOLE LAB / BABYLON.JS</span>
        <h3>
          A closer look
          <br />
          underfoot.
        </h3>
        <p>
          Three layers, one grounded foundation. This is an illustrative design
          study, not a scientifically validated flex test.
        </p>
        <label>
          Illustrative flex — {flex}%
          <input
            type="range"
            min="0"
            max="100"
            value={flex}
            onChange={(e) => {
              const value = Number(e.target.value);
              setFlex(value);
              flexRef.current = value;
            }}
          />
        </label>
        <dl className="materials-list">
          <dt>01 / Footbed</dt>
          <dd>The uppermost soft-colour layer meets the foot.</dd>
          <dt>02 / Midsole</dt>
          <dd>The light central layer gives the silhouette volume.</dd>
          <dt>03 / Outsole</dt>
          <dd>The dark bottom layer represents the tread foundation.</dd>
        </dl>
        <p className="small muted">
          The slider applies a simple visual deformation. It does not measure
          stress, durability, or cushioning.
        </p>
      </div>
    </div>
  );
}
