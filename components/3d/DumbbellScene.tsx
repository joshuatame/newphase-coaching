"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { Dumbbell } from "./Dumbbell";

export interface SceneHandle {
  group: THREE.Group | null;
}

interface DumbbellSceneProps {
  lowPoly?: boolean;
  onReady?: (handle: SceneHandle) => void;
}

function SpotlightRig() {
  const spotRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);

  useFrame(() => {
    if (spotRef.current && targetRef.current) {
      spotRef.current.target = targetRef.current;
    }
  });

  return (
    <>
      <spotLight
        ref={spotRef}
        position={[5.5, 8, 4]}
        angle={0.5}
        penumbra={0.45}
        intensity={6}
        color="#fff4e0"
        distance={30}
        castShadow={false}
      />
      <object3D ref={targetRef} position={[-0.8, 0, 0]} />
    </>
  );
}

function Rig({ lowPoly, onReady }: DumbbellSceneProps) {
  const group = useRef<THREE.Group>(null);
  const readySent = useRef(false);

  // R3F: refs are reliable inside the frame loop (React useEffect often misses first paint).
  useFrame(() => {
    if (readySent.current || !group.current) return;
    readySent.current = true;
    onReady?.({ group: group.current });
  });

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <>
      <ambientLight intensity={1.05} color="#f2f3f5" />
      <hemisphereLight args={["#ffffff", "#1a1d23", 0.85]} />
      <SpotlightRig />
      <directionalLight position={[4, 6, 3]} intensity={2.1} color="#ffffff" />
      <directionalLight position={[-4, 2, -2]} intensity={0.7} color="#b6ff3b" />
      <pointLight position={[0, 2.5, 4]} intensity={1.6} color="#ffffff" distance={16} />

      <group
        ref={group}
        position={isMobile ? [0, 0.05, 0] : [1.15, 0.1, 0]}
        scale={1}
      >
        <Suspense fallback={null}>
          <Dumbbell
            spinSpeed={isMobile ? 0.24 : 0.3}
            fitSize={isMobile ? 3.1 : 3.8}
          />
        </Suspense>
      </group>
    </>
  );
}

function LoaderMark() {
  return (
    <mesh position={[1.15, 0, 0]}>
      <boxGeometry args={[0.35, 0.35, 0.35]} />
      <meshBasicMaterial color="#b6ff3b" wireframe />
    </mesh>
  );
}

export function DumbbellScene({
  lowPoly = false,
  onReady,
}: DumbbellSceneProps) {
  return (
    <Canvas
      className="absolute inset-0 h-full w-full"
      dpr={[1, lowPoly ? 1.25 : 1.6]}
      camera={{ position: [0, 0.35, 6.2], fov: 40, near: 0.1, far: 80 }}
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
        gl.toneMappingExposure = 1.35;
      }}
    >
      <Suspense fallback={<LoaderMark />}>
        <Rig lowPoly={lowPoly} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

export default DumbbellScene;
