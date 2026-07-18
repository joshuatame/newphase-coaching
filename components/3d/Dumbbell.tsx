"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Center, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { withBasePath } from "@/lib/base-path";

const MODEL_URL = withBasePath("/models/dumbbell.glb");

interface DumbbellProps {
  /** Radians per second for idle Y-axis spin. */
  spinSpeed?: number;
}

/**
 * Client GLB hex dumbbell — sits at 45°, slowly spins on Y.
 */
export function Dumbbell({ spinSpeed = 0.28 }: DumbbellProps) {
  const spinRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : mesh.material
            ? [mesh.material]
            : [];
        mats.forEach((m) => {
          const std = m as THREE.MeshStandardMaterial;
          if ("envMapIntensity" in std) std.envMapIntensity = 1.15;
          std.needsUpdate = true;
        });
      }
    });
    return clone;
  }, [scene]);

  useEffect(() => {
    return () => {
      model.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).geometry?.dispose?.();
        }
      });
    };
  }, [model]);

  useFrame((_, delta) => {
    if (!spinRef.current) return;
    spinRef.current.rotation.y += delta * spinSpeed;
  });

  return (
    <group ref={spinRef}>
      {/* 45° sit-up angle */}
      <group rotation={[Math.PI / 4, 0, 0]}>
        <Center>
          <primitive object={model} />
        </Center>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);

export default Dumbbell;
