"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Dumbbell } from "./Dumbbell";
import { withBasePath } from "@/lib/base-path";

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

  useEffect(() => {
    if (spotRef.current && targetRef.current) {
      spotRef.current.target = targetRef.current;
      spotRef.current.target.updateMatrixWorld();
    }
  }, []);

  return (
    <>
      <spotLight
        ref={spotRef}
        position={[5.5, 8, 4]}
        angle={0.5}
        penumbra={0.45}
        intensity={5.5}
        color="#fff4e0"
        distance={30}
        castShadow={false}
      />
      <object3D ref={targetRef} position={[-0.8, 0, 0]} />
    </>
  );
}

function Rig({ lowPoly, onReady }: DumbbellSceneProps) {
  const group = useRef<THREE.Group | null>(null);
  const readySent = useRef(false);

  useEffect(() => {
    if (!group.current || readySent.current) return;
    readySent.current = true;
    onReady?.({ group: group.current });
  }, [onReady]);

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <>
      <ambientLight intensity={0.75} color="#eef0f4" />
      <hemisphereLight args={["#ffffff", "#1a1d23", 0.7]} />
      <SpotlightRig />
      <directionalLight position={[3, 5, 2]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-4, 1, -2]} intensity={0.55} color="#b6ff3b" />
      <pointLight position={[0, 2, 3]} intensity={1.2} color="#ffffff" distance={12} />

      <Suspense fallback={null}>
        <Environment
          files={withBasePath(
            lowPoly ? "/environments/studio.hdr" : "/environments/city.hdr",
          )}
          environmentIntensity={1}
        />
      </Suspense>

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
    <mesh position={[1.1, 0, 0]}>
      <boxGeometry args={[0.4, 0.4, 0.4]} />
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
        gl.toneMappingExposure = 1.2;
      }}
    >
      <Suspense fallback={<LoaderMark />}>
        <Rig lowPoly={lowPoly} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}

export default DumbbellScene;
