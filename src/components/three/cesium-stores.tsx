"use client";
import { useEffect, useRef, useState } from "react";
import { locations } from "@/lib/locations";
import { useWebGL } from "./webgl";
import {
  Viewer,
  Cartesian2,
  Cartesian3,
  Color,
  EllipsoidTerrainProvider,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  defined,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
export default function CesiumStores() {
  const ref = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [selected, setSelected] = useState(locations[0]);
  const [failed, setFailed] = useState(false);
  const webgl = useWebGL();
  useEffect(() => {
    if (!webgl || failed || !ref.current) return;
    const element = ref.current;
    let viewer: Viewer | undefined;
    let events: ScreenSpaceEventHandler | undefined;
    let observer: ResizeObserver | undefined;
    let intersection: IntersectionObserver | undefined;
    let onScreen = true;
    let animation: number | undefined;
    let visibility: (() => void) | undefined;
    const loss = (event: Event) => {
      event.preventDefault();
      setFailed(true);
    };
    try {
      viewer = new Viewer(element, {
        baseLayer: false,
        terrainProvider: new EllipsoidTerrainProvider(),
        animation: false,
        timeline: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
        skyBox: false,
        skyAtmosphere: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      });
      viewerRef.current = viewer;
      viewer.scene.canvas.addEventListener("webglcontextlost", loss);
      viewer.scene.globe.baseColor = Color.fromCssColorString("#596858");
      viewer.scene.backgroundColor = Color.fromCssColorString("#e9eade");
      viewer.resolutionScale = Math.min(1, 1 / window.devicePixelRatio);
      viewer.scene.globe.enableLighting = false;
      viewer.camera.setView({
        destination: Cartesian3.fromDegrees(72, 29, 12500000),
      });
      viewer.entities.add({
        polyline: {
          positions: Cartesian3.fromDegreesArray([
            61, 25, 62, 30, 66, 30, 69, 33, 71, 36, 75, 36, 77, 34, 74, 32, 72,
            28, 69, 24, 66, 24, 61, 25,
          ]),
          width: 2,
          material: Color.fromCssColorString("#bbc79a"),
        },
      });
      for (const location of locations)
        viewer.entities.add({
          id: location.id,
          position: Cartesian3.fromDegrees(
            location.longitude,
            location.latitude,
          ),
          point: {
            pixelSize: 12,
            color: Color.fromCssColorString("#d6f78b"),
            outlineColor: Color.fromCssColorString("#263021"),
            outlineWidth: 2,
          },
          label: {
            text: location.city,
            font: "14px sans-serif",
            fillColor: Color.WHITE,
            showBackground: true,
            backgroundColor: Color.fromCssColorString("#263021"),
            pixelOffset: new Cartesian2(0, -25),
            disableDepthTestDistance: Infinity,
          },
        });
      events = new ScreenSpaceEventHandler(viewer.scene.canvas);
      events.setInputAction((movement: { position: Cartesian2 }) => {
        const pick = viewer!.scene.pick(movement.position);
        if (defined(pick) && pick.id?.id) {
          const location = locations.find((x) => x.id === pick.id.id);
          if (location) setSelected(location);
        }
      }, ScreenSpaceEventType.LEFT_CLICK);
      observer = new ResizeObserver(() => {
        viewer?.resize();
        viewer?.scene.requestRender();
      });
      observer.observe(element);
      const render = () => {
        if (viewer && !viewer.isDestroyed()) {
          viewer.resize();
          viewer.render();
          animation = requestAnimationFrame(render);
        }
      };
      viewer.useDefaultRenderLoop = false;
      render();
      visibility = () => {
        if (animation) cancelAnimationFrame(animation);
        if (!document.hidden && onScreen) render();
      };
      document.addEventListener("visibilitychange", visibility);
      intersection = new IntersectionObserver((entries) => {
        onScreen = entries[0]?.isIntersecting ?? false;
        visibility?.();
      });
      intersection.observe(element);
    } catch {
      queueMicrotask(() => setFailed(true));
    }
    return () => {
      observer?.disconnect();
      intersection?.disconnect();
      if (animation) cancelAnimationFrame(animation);
      if (visibility)
        document.removeEventListener("visibilitychange", visibility);
      events?.destroy();
      viewer?.scene.canvas.removeEventListener("webglcontextlost", loss);
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
    };
  }, [webgl, failed]);
  function choose(id: string) {
    const location = locations.find((x) => x.id === id)!;
    setSelected(location);
    const viewer = viewerRef.current;
    if (viewer && !viewer.isDestroyed()) {
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(
          location.longitude,
          location.latitude,
          1800000,
        ),
        duration: 1,
      });
      viewer.scene.requestRender();
    }
  }
  return (
    <div className="experience-layout">
      <div className="scene-window globe-window">
        {webgl && !failed ? (
          <div ref={ref} className="cesium-container" />
        ) : (
          <div className="basic-globe">
            <div />
            <span>KARACHI · LAHORE · ISLAMABAD</span>
            <p>Basic location view / WebGL unavailable</p>
          </div>
        )}
        <span className="scene-annotation">
          LOCAL BASIC GLOBE / NO EXTERNAL IMAGERY OR TOKEN
        </span>
      </div>
      <div className="viewer-controls">
        <span className="eyebrow">CESIUM / LOCATION EXPLORER</span>
        <h3>
          Our imagined
          <br />
          places.
        </h3>
        <p>
          Fictional demonstration showrooms. These addresses and contact details
          are examples, not operating stores.
        </p>
        <label>
          Select a showroom
          <select
            aria-label="Select a showroom"
            value={selected.id}
            onChange={(e) => choose(e.target.value)}
          >
            {locations.map((x) => (
              <option key={x.id} value={x.id}>
                {x.city}
              </option>
            ))}
          </select>
        </label>
        <div className="store-card">
          <h4>{selected.name}</h4>
          <p>
            {selected.address}
            <br />
            {selected.hours}
          </p>
          <a href={`tel:${selected.phone.replaceAll(" ", "")}`}>
            {selected.phone}
          </a>
          <a href={`mailto:${selected.email}`}>{selected.email} ↗</a>
        </div>
        <p className="small muted">
          Click a pin or use the selector. This is a store explorer, not live
          shipment tracking.
        </p>
      </div>
    </div>
  );
}
