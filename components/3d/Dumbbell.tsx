"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface DumbbellProps {
  lowPoly?: boolean;
}

/**
 * Procedural hexagonal-plate dumbbell — tuned to stay visible even without HDR.
 */
export function Dumbbell({ lowPoly = false }: DumbbellProps) {
  const handleSeg = lowPoly ? 16 : 48;

  const materials = useMemo(() => {
    const metalDark = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#2a2e36"),
      metalness: 0.85,
      roughness: 0.35,
    });
    const metalSteel = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#d7dde6"),
      metalness: 0.9,
      roughness: 0.22,
      envMapIntensity: 1.2,
    });
    const plate = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1c2028"),
      metalness: 0.55,
      roughness: 0.42,
      envMapIntensity: 0.8,
    });
    const plateEdge = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#3a404c"),
      metalness: 0.7,
      roughness: 0.35,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#b6ff3b"),
      metalness: 0.35,
      roughness: 0.28,
      emissive: new THREE.Color("#b6ff3b"),
      emissiveIntensity: 0.55,
    });
    return { metalDark, metalSteel, plate, plateEdge, accent };
  }, []);

  const plates = useMemo(() => {
    const defs: { r: number; t: number; y: number; accent?: boolean }[] = [];
    const sizes = [
      { r: 1.15, t: 0.36 },
      { r: 1.0, t: 0.3 },
      { r: 0.86, t: 0.26 },
    ];
    const gap = 0.025;
    [-1, 1].forEach((side) => {
      let y = side * 1.1;
      sizes.forEach((s, i) => {
        y += side * (s.t / 2 + (i === 0 ? 0 : gap));
        defs.push({ r: s.r, t: s.t, y, accent: i === 0 });
        y += side * (s.t / 2);
      });
    });
    return defs;
  }, []);

  return (
    <group rotation={[0, 0, Math.PI / 2]} scale={1.25}>
      <mesh material={materials.metalSteel}>
        <cylinderGeometry args={[0.22, 0.22, 2.1, handleSeg]} />
      </mesh>

      {[-0.52, -0.22, 0.22, 0.52].map((y, i) => (
        <mesh key={`knurl-${i}`} position={[0, y, 0]} material={materials.metalDark}>
          <cylinderGeometry args={[0.235, 0.235, 0.11, handleSeg]} />
        </mesh>
      ))}

      {[-1, 1].map((side) => (
        <group key={`collar-${side}`} position={[0, side * 0.98, 0]}>
          <mesh material={materials.metalDark}>
            <cylinderGeometry args={[0.44, 0.38, 0.24, 6]} />
          </mesh>
          <mesh position={[0, side * 0.13, 0]} material={materials.accent}>
            <cylinderGeometry args={[0.46, 0.46, 0.04, 6]} />
          </mesh>
        </group>
      ))}

      {plates.map((p, i) => (
        <group key={`plate-${i}`} position={[0, p.y, 0]}>
          <mesh material={materials.plate} rotation={[0, Math.PI / 6, 0]}>
            <cylinderGeometry args={[p.r, p.r, p.t, 6]} />
          </mesh>
          <mesh material={materials.plateEdge} rotation={[0, Math.PI / 6, 0]}>
            <cylinderGeometry args={[p.r * 0.9, p.r * 0.9, p.t * 0.5, 6]} />
          </mesh>
          {p.accent && (
            <mesh material={materials.accent} rotation={[0, Math.PI / 6, 0]}>
              <cylinderGeometry args={[p.r * 0.99, p.r * 0.99, 0.045, 6]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export default Dumbbell;
