"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
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

function Rig({ lowPoly, onReady }: DumbbellSceneProps) {
  const group = useRef<THREE.Group | null>(null);
  const keyLight = useRef<THREE.DirectionalLight | null>(null);
  const readySent = useRef(false);

  // Publish handle as soon as the group mounts — do not wait for HDR.
  useEffect(() => {
    if (!group.current || readySent.current) return;
    readySent.current = true;
    onReady?.({ group: group.current, keyLight: keyLight.current });
  }, [onReady]);

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <>
      <color attach="background" args={["#050506"]} />
      <fog attach="fog" args={["#050506", 8, 22]} />

      <ambientLight intensity={0.65} color="#e8eaee" />
      <hemisphereLight args={["#f5f5f2", "#111318", 0.55]} />
      <directionalLight
        ref={keyLight}
        position={[5, 7, 6]}
        intensity={2.4}
        color="#ffffff"
      />
      <directionalLight position={[-5, 2, -3]} intensity={0.9} color="#85b82b" />
      <pointLight position={[1, 1, 4]} intensity={1.4} color="#b6ff3b" distance={14} />
      <pointLight position={[-2, -1, 3]} intensity={0.6} color="#ffffff" distance={10} />

      {/* HDR is optional enhancement — dumbbell must render without it. */}
      <Suspense fallback={null}>
        <Environment
          files={withBasePath(
            lowPoly ? "/environments/studio.hdr" : "/environments/city.hdr",
          )}
          environmentIntensity={1.1}
        />
      </Suspense>

      <group
        ref={group}
        position={isMobile ? [0.2, 0.05, 0] : [1.55, 0.05, 0]}
        rotation={[0.35, -0.55, 0.2]}
        scale={isMobile ? 1.05 : 1.35}
      >
        <Float
          speed={0.7}
          rotationIntensity={0.06}
          floatIntensity={0.22}
          floatingRange={[-0.04, 0.04]}
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
      className="absolute inset-0 h-full w-full"
      dpr={[1, lowPoly ? 1.35 : 1.75]}
      camera={{ position: [0, 0.2, 6.2], fov: 42, near: 0.1, far: 40 }}
      gl={{
        antialias: !lowPoly,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "transparent",
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.15;
      }}
    >
      <Rig lowPoly={lowPoly} onReady={onReady} />
    </Canvas>
  );
}

export default DumbbellScene;
