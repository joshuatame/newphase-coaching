"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface DumbbellProps {
  lowPoly?: boolean;
}

/**
 * Procedural hexagonal-plate dumbbell.
 * Classic competition hex plates + chrome handle + subtle NewPhase accent collar rings.
 */
export function Dumbbell({ lowPoly = false }: DumbbellProps) {
  const handleSeg = lowPoly ? 16 : 40;

  const materials = useMemo(() => {
    const metalDark = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#14171c"),
      metalness: 0.98,
      roughness: 0.28,
    });
    const metalSteel = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#b8bec8"),
      metalness: 1,
      roughness: 0.18,
    });
    const plate = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#0a0b0e"),
      metalness: 0.72,
      roughness: 0.38,
    });
    const plateEdge = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1f232b"),
      metalness: 0.85,
      roughness: 0.3,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#b6ff3b"),
      metalness: 0.55,
      roughness: 0.25,
      emissive: new THREE.Color("#b6ff3b"),
      emissiveIntensity: 0.28,
    });
    return { metalDark, metalSteel, plate, plateEdge, accent };
  }, []);

  /**
   * Hex plate stacks along the handle axis (local Y after group rotation).
   * Each plate is a 6-sided cylinder (true hexagon prism).
   */
  const plates = useMemo(() => {
    const defs: {
      r: number;
      t: number;
      y: number;
      accent?: boolean;
    }[] = [];
    const sizes = [
      { r: 1.12, t: 0.34 },
      { r: 0.98, t: 0.3 },
      { r: 0.84, t: 0.26 },
    ];
    const gap = 0.02;
    [-1, 1].forEach((side) => {
      let y = side * 1.08;
      sizes.forEach((s, i) => {
        y += side * (s.t / 2 + (i === 0 ? 0 : gap));
        defs.push({ r: s.r, t: s.t, y, accent: i === 0 });
        y += side * (s.t / 2);
      });
    });
    return defs;
  }, []);

  return (
    <group rotation={[0, 0, Math.PI / 2]} scale={1.05}>
      {/* Chrome handle */}
      <mesh material={materials.metalSteel}>
        <cylinderGeometry args={[0.2, 0.2, 2.05, handleSeg]} />
      </mesh>

      {/* Knurl bands */}
      {[-0.5, -0.22, 0.22, 0.5].map((y, i) => (
        <mesh key={`knurl-${i}`} position={[0, y, 0]} material={materials.metalDark}>
          <cylinderGeometry args={[0.215, 0.215, 0.1, handleSeg]} />
        </mesh>
      ))}

      {/* Hex collars */}
      {[-1, 1].map((side) => (
        <group key={`collar-${side}`} position={[0, side * 0.95, 0]}>
          <mesh material={materials.metalDark}>
            <cylinderGeometry args={[0.42, 0.36, 0.22, 6]} />
          </mesh>
          <mesh position={[0, side * 0.12, 0]} material={materials.accent}>
            <cylinderGeometry args={[0.44, 0.44, 0.035, 6]} />
          </mesh>
        </group>
      ))}

      {/* Hex weight plates */}
      {plates.map((p, i) => (
        <group key={`plate-${i}`} position={[0, p.y, 0]}>
          <mesh material={materials.plate} rotation={[0, Math.PI / 6, 0]}>
            <cylinderGeometry args={[p.r, p.r, p.t, 6]} />
          </mesh>
          {/* Slightly inset face edge for bevelled hex look */}
          <mesh
            material={materials.plateEdge}
            rotation={[0, Math.PI / 6, 0]}
            position={[0, p.t * 0.02 * Math.sign(p.y || 1), 0]}
          >
            <cylinderGeometry args={[p.r * 0.92, p.r * 0.92, p.t * 0.55, 6]} />
          </mesh>
          {p.accent && (
            <mesh material={materials.accent} rotation={[0, Math.PI / 6, 0]}>
              <cylinderGeometry args={[p.r * 0.98, p.r * 0.98, 0.04, 6]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export default Dumbbell;
