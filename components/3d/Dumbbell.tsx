"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { withBasePath } from "@/lib/base-path";

function getModelUrl() {
  return withBasePath("/models/dumbbell.glb");
}

interface DumbbellProps {
  spinSpeed?: number;
  fitSize?: number;
}

/**
 * Client GLB hex dumbbell — normalised to a visible size, 45° tilt, slow Y spin.
 */
export function Dumbbell({ spinSpeed = 0.32, fitSize = 3.2 }: DumbbellProps) {
  const spinRef = useRef<THREE.Group>(null);
  const fitRef = useRef<THREE.Group>(null);
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
          if (c.r < 0.05 && c.g < 0.05 && c.b < 0.05) {
            m.color.set("#2f343d");
            m.roughness = 0.55;
            m.metalness = 0.12;
          }
        }
        if ("envMapIntensity" in m) m.envMapIntensity = 1.3;
        m.needsUpdate = true;
      });
    });
    return clone;
  }, [scene]);

  useLayoutEffect(() => {
    const fit = fitRef.current;
    if (!fit) return;

    fit.position.set(0, 0, 0);
    fit.scale.set(1, 1, 1);

    // Include the model in the measure after it's mounted as a child.
    const box = new THREE.Box3().setFromObject(fit);
    if (box.isEmpty()) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const scale = fitSize / maxDim;

    fit.scale.setScalar(scale);
    fit.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  }, [model, fitSize]);

  useFrame((_, delta) => {
    if (!spinRef.current) return;
    spinRef.current.rotation.y += delta * spinSpeed;
  });

  return (
    <group ref={spinRef}>
      <group rotation={[Math.PI / 4, 0, 0]}>
        <group ref={fitRef}>
          <primitive object={model} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(getModelUrl());

export default Dumbbell;
