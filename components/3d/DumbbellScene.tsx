"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Dumbbell } from "./Dumbbell";
import { withBasePath } from "@/lib/base-path";

export interface SceneHandle {
  group: THREE.Group | null;
  keyLight: THREE.DirectionalLight | null;
}

interface DumbbellSceneProps {
  lowPoly?: boolean;
  interactive?: boolean;
  onReady?: (handle: SceneHandle) => void;
}

/** Same-origin HDR — required under platform CSP (no remote CDN fetches). */
const CITY_HDR = withBasePath("/environments/city.hdr");
const STUDIO_HDR = withBasePath("/environments/studio.hdr");

function Rig({ lowPoly, onReady }: DumbbellSceneProps) {
  const group = useRef<THREE.Group | null>(null);
  const keyLight = useRef<THREE.DirectionalLight | null>(null);
  const envFile = lowPoly ? STUDIO_HDR : CITY_HDR;

  return (
    <>
      <ambientLight intensity={0.22} color="#c7cbd1" />
      <directionalLight
        ref={keyLight}
        position={[4, 6, 5]}
        intensity={1.6}
        color="#ffffff"
      />
      <directionalLight position={[-6, -2, -4]} intensity={0.45} color="#85b82b" />
      <pointLight position={[0, 0, 4]} intensity={0.7} color="#b6ff3b" distance={12} />

      <Suspense fallback={null}>
        <Environment
          files={envFile}
          background
          blur={lowPoly ? 0.88 : 0.72}
          backgroundIntensity={0.55}
          environmentIntensity={0.95}
        />
      </Suspense>

      <group
        ref={(node) => {
          group.current = node;
          if (node) onReady?.({ group: node, keyLight: keyLight.current });
        }}
      >
        <Float
          speed={0.85}
          rotationIntensity={0.08}
          floatIntensity={0.28}
          floatingRange={[-0.05, 0.05]}
        >
          <Dumbbell lowPoly={lowPoly} />
        </Float>
      </group>
    </>
  );
}

export function DumbbellScene({
  lowPoly = false,
  onReady,
}: DumbbellSceneProps) {
  return (
    <Canvas
      dpr={[1, lowPoly ? 1.25 : 1.75]}
      camera={{ position: [0, 0, 7], fov: 38 }}
      gl={{
        antialias: !lowPoly,
        alpha: false,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ background: "#050506" }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x050506, 1);
      }}
    >
      <Rig lowPoly={lowPoly} onReady={onReady} />
    </Canvas>
  );
}

export default DumbbellScene;
