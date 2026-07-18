"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { withBasePath } from "@/lib/base-path";

function getModelUrl() {
  return withBasePath("/models/dumbbell.glb");
}

interface DumbbellProps {
  spinSpeed?: number;
  /** Target longest-axis size in scene units after normalisation. */
  fitSize?: number;
}

/**
 * Client GLB hex dumbbell — normalised to a visible size, 45° tilt, slow Y spin.
 */
export function Dumbbell({ spinSpeed = 0.32, fitSize = 3.2 }: DumbbellProps) {
  const spinRef = useRef<THREE.Group>(null);
  const url = getModelUrl();
  const { scene } = useGLTF(url);

  const model = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : mesh.material
          ? [mesh.material]
          : [];

      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m.color) {
          const c = m.color;
          // Sketchfab rubber is near-black (~0.01) — lift so lights can catch it.
          if (c.r < 0.08 && c.g < 0.08 && c.b < 0.08) {
            m.color.set("#3a404a");
            m.roughness = 0.5;
            m.metalness = Math.min(m.metalness ?? 0.1, 0.2);
          }
        }
        if ("emissive" in m && m.emissive) {
          m.emissive.set("#0a0c10");
          m.emissiveIntensity = 0.15;
        }
        if ("envMapIntensity" in m) m.envMapIntensity = 1.45;
        m.needsUpdate = true;
      });
    });

    // Fit while detached so Sketchfab root transforms can't bury the camera
    // inside near-black rubber (looks like an empty canvas).
    clone.position.set(0, 0, 0);
    clone.scale.set(1, 1, 1);
    clone.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(clone);
    if (!box.isEmpty()) {
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      const maxDim = Math.max(size.x, size.y, size.z, 0.001);
      const scale = fitSize / maxDim;
      clone.scale.setScalar(scale);
      clone.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale,
      );
    }

    return clone;
  }, [scene, fitSize]);

  useFrame((_, delta) => {
    if (!spinRef.current) return;
    spinRef.current.rotation.y += delta * spinSpeed;
  });

  return (
    <group ref={spinRef}>
      <group rotation={[Math.PI / 4, 0, 0]}>
        <primitive object={model} />
      </group>
    </group>
  );
}

useGLTF.preload(getModelUrl());

export default Dumbbell;
