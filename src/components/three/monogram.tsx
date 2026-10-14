"use client";
import { useMemo, useEffect } from "react";
import { CanvasTexture, Matrix4 } from "three";
export default function Monogram({
  text,
  transform,
}: {
  text: string;
  transform: { matrix: number[] };
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext("2d")!;
    context.clearRect(0, 0, 256, 128);
    context.font = "700 58px sans-serif";
    context.fillStyle = "#2c3327";
    context.textAlign = "center";
    context.fillText(text, 128, 82);
    return new CanvasTexture(canvas);
  }, [text]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh
      matrix={new Matrix4().fromArray(transform.matrix)}
      matrixAutoUpdate={false}
    >
      <planeGeometry args={[0.35, 0.175]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
