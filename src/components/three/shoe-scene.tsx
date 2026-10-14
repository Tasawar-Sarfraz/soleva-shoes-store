"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, RoundedBox } from "@react-three/drei";
import { Component, useEffect, useRef } from "react";
import { Group, ACESFilmicToneMapping } from "three";
import { ShoeModel } from "./shoe-model";
import { useShopping } from "@/lib/client-store";
import { useReducedMotion, useDocumentVisible } from "./webgl";
type Props = {
  category: string;
  color: string;
  hero?: boolean;
  active?: boolean;
  explode?: number;
  rotation?: number;
  monogram?: React.ReactNode;
  onPart?: (part: string) => void;
  onReady?: () => void;
  onFailure?: () => void;
};
class Boundary extends Component<
  { children: React.ReactNode; onFailure?: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure?.();
  }
  render() {
    return this.state.failed ? (
      <div className="scene-error" role="status">
        3D is unavailable. The illustration and shopping controls remain
        available.
      </div>
    ) : (
      this.props.children
    );
  }
}
function ContextGuard({ onFailure }: { onFailure?: () => void }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lose = (e: Event) => {
      e.preventDefault();
      onFailure?.();
    };
    canvas.addEventListener("webglcontextlost", lose);
    return () => {
      canvas.removeEventListener("webglcontextlost", lose);
      gl.renderLists.dispose();
    };
  }, [gl, onFailure]);
  return null;
}
function ObjectScene(props: Props) {
  const ref = useRef<Group>(null);
  const reduced = useReducedMotion();
  const preference = useShopping((s) => s.reduceEffects);
  useFrame((_, delta) => {
    if (ref.current && props.hero && props.active && !reduced && !preference)
      ref.current.rotation.y += Math.min(delta, 0.05) * 0.07;
  });
  return (
    <>
      <ambientLight intensity={1.4} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <directionalLight position={[-4, 1, -2]} intensity={1.6} />
      <group
        ref={ref}
        position={[0, props.hero ? 0.21 : 0.05, 0]}
        rotation={[0.05, props.hero ? -0.5 : props.rotation || 0, 0]}
      >
        <ShoeModel
          category={props.category}
          color={props.color}
          explode={props.explode}
          monogram={props.monogram}
          onPart={props.onPart}
        />
      </group>
      {props.hero && (
        <RoundedBox
          args={[3.65, 0.22, 1.8]}
          radius={0.05}
          position={[0, -0.22, 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#deddd0" roughness={0.95} />
        </RoundedBox>
      )}
      <ContactShadows
        position={[0, -0.42, 0]}
        opacity={0.25}
        blur={2.5}
        far={4}
        scale={7}
        resolution={256}
        frames={props.hero ? Infinity : 1}
      />
      {!props.hero && (
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={3.5}
          maxDistance={8}
          maxPolarAngle={Math.PI * 0.66}
        />
      )}
      <ContextGuard onFailure={props.onFailure} />
    </>
  );
}
export default function ShoeScene(props: Props) {
  const quality = useShopping((s) => s.quality);
  const visible = useDocumentVisible();
  return (
    <Boundary onFailure={props.onFailure}>
      <Canvas
        shadows="percentage"
        dpr={quality === "high" ? [1, 1.5] : [1, 1]}
        frameloop={props.active === false || !visible ? "never" : "always"}
        camera={{
          position: props.hero ? [2.6, 1.9, 6.5] : [3.8, 2.2, 5.3],
          fov: props.hero ? 35 : 40,
        }}
        gl={{
          antialias: quality === "high",
          alpha: true,
          toneMapping: ACESFilmicToneMapping,
        }}
        onCreated={() => props.onReady?.()}
      >
        <ObjectScene {...props} />
      </Canvas>
    </Boundary>
  );
}
