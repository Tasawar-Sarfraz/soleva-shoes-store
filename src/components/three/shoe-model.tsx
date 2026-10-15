"use client";
import { useMemo, useEffect } from "react";
import {
  Shape,
  ExtrudeGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  CatmullRomCurve3,
  Vector3,
  TubeGeometry,
  CanvasTexture,
  RepeatWrapping,
  DoubleSide,
} from "three";
import { RoundedBox } from "@react-three/drei";
function soleShape() {
  const shape = new Shape();
  shape.moveTo(-1.54, 0.07);
  shape.bezierCurveTo(-0.6, -0.03, 0.72, -0.03, 1.6, 0.04);
  shape.bezierCurveTo(1.67, -0.03, 1.62, -0.19, 1.49, -0.21);
  shape.bezierCurveTo(0.54, -0.28, -0.6, -0.26, -1.5, -0.15);
  shape.bezierCurveTo(-1.62, -0.12, -1.63, 0, -1.54, 0.07);
  return shape;
}
function upperGeometry(category: string, designIndex: number) {
  const boot = category === "Boots",
    formal = category === "Formal",
    casual = category === "Casual";
  const style = ((designIndex % 6) + 6) % 6;
  const bootHeights = [1.65, 1.88, 1.5, 1.72, 1.96, 1.57];
  const heelHeight = boot
    ? bootHeights[style]
    : (formal ? 0.82 : casual ? 0.7 : 0.82) +
      [0, 0.15, -0.08, 0.05, 0.2, -0.03][style];
  const vampHeight = (formal ? 0.53 : casual ? 0.7 : 0.7) +
    [0, 0.03, -0.1, 0.08, -0.02, 0.04][style];
  const points = [
    [-1.55, 0.4, 0.05],
    [-1.4, heelHeight - 0.04, 0.25],
    [-1.15, heelHeight, 0.29],
    [-0.88, heelHeight - 0.04, 0.3],
    [-0.65, boot ? heelHeight - 0.5 : formal ? heelHeight - 0.18 : heelHeight + 0.06, 0.32],
    [-0.3, vampHeight, 0.36],
    [0.15, vampHeight - 0.11, 0.39],
    [0.7, vampHeight - 0.17, 0.4],
    [1.1, 0.29 + [0, 0, 0.06, -0.02, 0.03, -0.04][style], 0.31],
    [1.4, 0.2, 0.2],
    [1.54 + (style === 1 ? 0.05 : style === 5 ? -0.04 : 0), 0.11, 0.035],
  ];
  const curve = new CatmullRomCurve3(
    points.map((p) => new Vector3(...(p as [number, number, number]))),
  );
  const stations = curve.getPoints(60),
    sides = 24;
  const positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let i = 0; i < stations.length; i++)
    for (let j = 0; j <= sides; j++) {
      const theta = (j / sides) * Math.PI;
      const p = stations[i];
      positions.push(
        p.x,
        0.04 + p.y * Math.pow(Math.sin(theta), 0.85),
        Math.max(0.02, p.z) * Math.cos(theta),
      );
      uv.push(i / 60, j / sides);
    }
  for (let i = 0; i < 60; i++)
    for (let j = 0; j < sides; j++) {
      const x = stations[i].x;
      if (x > -1.38 && x < -0.86 && j > 7 && j < 17) continue;
      const a = i * (sides + 1) + j,
        b = a + sides + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
function weaveTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f5f5ef";
  ctx.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 64; i += 4) {
    ctx.strokeStyle = i % 8 ? "#cbd0c2" : "#d9dccf";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(64, i);
    ctx.stroke();
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(8, 3);
  return texture;
}
export function ShoeModel({
  category = "Sneakers",
  color = "#dfe2d1",
  designIndex = 0,
  explode = 0,
  monogram,
  onPart,
}: {
  category?: string;
  color?: string;
  designIndex?: number;
  explode?: number;
  monogram?: React.ReactNode;
  onPart?: (part: string) => void;
}) {
  const style = ((designIndex % 6) + 6) % 6;
  const upper = useMemo(
    () => upperGeometry(category, style),
    [category, style],
  );
  const sole = useMemo(
    () =>
      new ExtrudeGeometry(soleShape(), {
        depth: 0.66,
        bevelEnabled: true,
        bevelSegments: 3,
        bevelSize: 0.045,
        bevelThickness: 0.05,
        curveSegments: 20,
      }),
    [],
  );
  const texture = useMemo(() => weaveTexture(), []);
  const laces = useMemo(
    () =>
      Array.from({ length: style === 5 ? 3 : 5 }, (_, i) => {
        const x = -0.67 + i * 0.16,
          y =
            (category === "Formal"
              ? 0.69
              : category === "Casual"
                ? 0.76
                : 0.94) -
            i * 0.1;
        return new TubeGeometry(
          new CatmullRomCurve3([
            new Vector3(x - 0.03, y - 0.1, -0.22),
            new Vector3(x, y, 0),
            new Vector3(x + 0.03, y - 0.1, 0.22),
          ]),
          12,
          0.019,
          6,
          false,
        );
      }),
    [category, style],
  );
  const sideCurves = useMemo(
    () =>
      [-1, 1].map(
        (side) =>
          new TubeGeometry(
            new CatmullRomCurve3([
              new Vector3(-1.32, 0.45, 0.28 * side),
              new Vector3(-0.82, 0.28, 0.33 * side),
              new Vector3(-0.4, 0.43, 0.37 * side),
              new Vector3(0.15, 0.25, 0.4 * side),
              new Vector3(0.68, 0.2, 0.4 * side),
              new Vector3(1.25, 0.15, 0.28 * side),
            ]),
            32,
            0.024,
            6,
            false,
          ),
      ),
    [],
  );
  useEffect(
    () => () => {
      texture.dispose();
      upper.dispose();
      sole.dispose();
      laces.forEach((g) => g.dispose());
      sideCurves.forEach((g) => g.dispose());
    },
    [texture, upper, sole, laces, sideCurves],
  );
  const collarHeight =
    category === "Boots"
      ? [1.64, 1.87, 1.49, 1.71, 1.95, 1.56][style]
      : (category === "Formal" ? 0.82 : category === "Casual" ? 0.7 : 0.82) +
        [0, 0.15, -0.08, 0.05, 0.2, -0.03][style];
  return (
    <group rotation={[0, 0, -0.04]}>
      <group
        position={[0, explode * 0.72, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPart?.("upper");
        }}
      >
        <mesh geometry={upper} castShadow receiveShadow>
          <meshStandardMaterial
            color={color}
            roughness={category === "Formal" ? 0.45 : 0.85}
            map={
              category === "Formal" || category === "Boots"
                ? undefined
                : texture
            }
            side={DoubleSide}
          />
        </mesh>
        <mesh position={[-1.12, collarHeight - 0.08, 0]} scale={[1.1, 1, 0.92]}>
          <cylinderGeometry args={[0.245, 0.19, 0.13, 32]} />
          <meshStandardMaterial color="#343b30" roughness={1} />
        </mesh>
        <mesh
          position={[-1.12, collarHeight, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1.27, 0.96, 1]}
        >
          <torusGeometry args={[0.23, 0.042, 8, 28]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
        {category !== "Formal" &&
          sideCurves.map((geometry, i) => (
            <mesh key={i} geometry={geometry}>
              <meshStandardMaterial
                color={
                  style === 1
                    ? "#bd765e"
                    : style === 4
                      ? "#6d87aa"
                      : category === "Running"
                        ? "#afd359"
                        : "#7f926a"
                }
                roughness={0.8}
              />
            </mesh>
          ))}
        {(style === 2 || style === 5) && (
          <RoundedBox
            args={[style === 2 ? 0.42 : 0.34, 0.11, 0.74]}
            radius={0.035}
            position={style === 2 ? [-0.18, 0.57, 0] : [-0.51, 0.68, 0]}
            rotation={[0, 0, -0.08]}
          >
            <meshStandardMaterial
              color={style === 5 ? "#b79a69" : color}
              roughness={category === "Formal" ? 0.48 : 0.75}
            />
          </RoundedBox>
        )}
        {style === 3 && (
          <RoundedBox
            args={[0.62, 0.09, 0.53]}
            radius={0.045}
            position={[0.84, 0.23, 0]}
            rotation={[0, 0, 0.08]}
          >
            <meshStandardMaterial
              color={category === "Formal" ? "#9e795b" : "#e4e0d4"}
              roughness={0.62}
            />
          </RoundedBox>
        )}
        <RoundedBox
          args={[0.18, 0.38, 0.05]}
          radius={0.02}
          position={[-1.43, 0.47, 0]}
          rotation={[0, 0, -0.15]}
        >
          <meshStandardMaterial color="#818e6e" />
        </RoundedBox>
      </group>
      <mesh
        geometry={sole}
        position={[0, -explode * 0.18, -0.33]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onPart?.("midsole");
        }}
      >
        <meshStandardMaterial color="#eeecdf" roughness={0.9} />
      </mesh>
      <group
        position={[0, -0.25 - explode * 0.55, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPart?.("outsole");
        }}
      >
        {Array.from({ length: 13 }, (_, i) => (
          <RoundedBox
            key={i}
            args={[0.16, 0.065, 0.69]}
            radius={0.025}
            smoothness={2}
            position={[-1.37 + i * 0.23, 0, 0]}
            castShadow
          >
            <meshStandardMaterial color="#30362b" roughness={0.95} />
          </RoundedBox>
        ))}
      </group>
      <group
        position={[0, explode * 1.22, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPart?.("laces");
        }}
      >
        {style !== 2 &&
          laces.map((geometry, i) => (
            <mesh key={i} geometry={geometry} castShadow>
              <meshStandardMaterial color="#f9f7ed" roughness={0.8} />
            </mesh>
          ))}
      </group>
      {monogram}
    </group>
  );
}
