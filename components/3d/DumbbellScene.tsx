"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Dumbbell } from "./Dumbbell";

export interface SceneHandle {
  group: THREE.Group | null;
  keyLight: THREE.DirectionalLight | null;
}

interface DumbbellSceneProps {
  lowPoly?: boolean;
  interactive?: boolean;
  onReady?: (handle: SceneHandle) => void;
}

function Rig({ lowPoly, onReady }: DumbbellSceneProps) {
  const group = useRef<THREE.Group | null>(null);
  const keyLight = useRef<THREE.DirectionalLight | null>(null);

  return (
    <>
      <ambientLight intensity={0.35} color="#c7cbd1" />
      <directionalLight
        ref={keyLight}
        position={[4, 6, 5]}
        intensity={2.4}
        color="#ffffff"
        castShadow
      />
      <directionalLight position={[-6, -2, -4]} intensity={0.6} color="#85b82b" />
      <pointLight position={[0, 0, 4]} intensity={1.1} color="#b6ff3b" distance={12} />

      <group
        ref={(node) => {
          group.current = node;
          if (node) onReady?.({ group: node, keyLight: keyLight.current });
        }}
      >
        <Float
          speed={1.2}
          rotationIntensity={0.35}
          floatIntensity={0.5}
          floatingRange={[-0.08, 0.08]}
        >
          <Dumbbell lowPoly={lowPoly} />
        </Float>
      </group>

      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
    </>
  );
}

export function DumbbellScene({
  lowPoly = false,
  onReady,
}: DumbbellSceneProps) {
  return (
    <Canvas
      dpr={[1, lowPoly ? 1.25 : 1.8]}
      camera={{ position: [0, 0, 7], fov: 38 }}
      gl={{
        antialias: !lowPoly,
        alpha: true,
        powerPreference: "high-performance",
      }}
      style={{ background: "transparent" }}
    >
      <Rig lowPoly={lowPoly} onReady={onReady} />
    </Canvas>
  );
}

export default DumbbellScene;
