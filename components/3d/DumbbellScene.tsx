"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Dumbbell } from "./Dumbbell";
import { withBasePath } from "@/lib/base-path";

export interface SceneHandle {
  group: THREE.Group | null;
  spot: THREE.SpotLight | null;
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
      {/* Spot from top-right, casting down toward left */}
      <spotLight
        ref={spotRef}
        position={[5.5, 7.5, 3.5]}
        angle={0.42}
        penumbra={0.55}
        intensity={4.2}
        color="#fff6e8"
        distance={28}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <object3D ref={targetRef} position={[-1.2, -0.4, 0]} />
    </>
  );
}

function Rig({ lowPoly, onReady }: DumbbellSceneProps) {
  const group = useRef<THREE.Group | null>(null);
  const spot = useRef<THREE.SpotLight | null>(null);
  const readySent = useRef(false);

  useEffect(() => {
    if (!group.current || readySent.current) return;
    readySent.current = true;
    onReady?.({ group: group.current, spot: spot.current });
  }, [onReady]);

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <>
      <ambientLight intensity={0.28} color="#c7cbd1" />
      <hemisphereLight args={["#dfe3ea", "#090a0c", 0.35]} />
      <SpotlightRig />
      {/* Soft fill from left so the lit side reads clearly */}
      <directionalLight position={[-4, 2, -2]} intensity={0.35} color="#85b82b" />

      <Suspense fallback={null}>
        <Environment
          files={withBasePath(
            lowPoly ? "/environments/studio.hdr" : "/environments/city.hdr",
          )}
          environmentIntensity={0.85}
        />
      </Suspense>

      <group
        ref={group}
        position={isMobile ? [0.15, -0.15, 0] : [1.4, -0.1, 0]}
        scale={isMobile ? 0.95 : 1.15}
      >
        <Suspense fallback={null}>
          <Dumbbell spinSpeed={isMobile ? 0.22 : 0.28} />
        </Suspense>
      </group>

      {!lowPoly && (
        <ContactShadows
          position={[0, -1.65, 0]}
          opacity={0.45}
          scale={14}
          blur={2.6}
          far={5}
        />
      )}
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
      dpr={[1, lowPoly ? 1.25 : 1.7]}
      shadows
      camera={{ position: [0, 0.35, 6.4], fov: 40, near: 0.1, far: 50 }}
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
        gl.toneMappingExposure = 1.05;
      }}
    >
      <Rig lowPoly={lowPoly} onReady={onReady} />
    </Canvas>
  );
}

export default DumbbellScene;
