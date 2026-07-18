"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface DumbbellProps {
  lowPoly?: boolean;
}

/**
 * Procedural dumbbell built entirely from primitive geometry:
 * a knurled-look handle, inner collars and stacked bumper plates on
 * each side. No external model files required.
 */
export function Dumbbell({ lowPoly = false }: DumbbellProps) {
  const seg = lowPoly ? 20 : 48;

  const materials = useMemo(() => {
    const metalDark = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#1a1d23"),
      metalness: 0.95,
      roughness: 0.32,
    });
    const metalSteel = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#808791"),
      metalness: 1,
      roughness: 0.22,
    });
    const plate = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#090a0c"),
      metalness: 0.6,
      roughness: 0.45,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#b6ff3b"),
      metalness: 0.4,
      roughness: 0.3,
      emissive: new THREE.Color("#b6ff3b"),
      emissiveIntensity: 0.35,
    });
    return { metalDark, metalSteel, plate, accent };
  }, []);

  // Plate stack definition: [radius, thickness, xOffset, material]
  const plates = useMemo(() => {
    const defs: {
      r: number;
      t: number;
      x: number;
      mat: THREE.MeshStandardMaterial;
      accentRing?: boolean;
    }[] = [];
    const innerX = 1.05;
    const sizes = [
      { r: 1.05, t: 0.28 },
      { r: 0.92, t: 0.26 },
      { r: 0.78, t: 0.24 },
    ];
    [-1, 1].forEach((side) => {
      let x = side * innerX;
      sizes.forEach((s, i) => {
        x += side * (s.t / 2 + (i === 0 ? 0 : 0.02));
        defs.push({
          r: s.r,
          t: s.t,
          x,
          mat: materials.plate,
          accentRing: i === 0,
        });
        x += side * (s.t / 2);
      });
    });
    return defs;
  }, [materials]);

  return (
    <group rotation={[0, 0, Math.PI / 2]} scale={0.85}>
      {/* Handle */}
      <mesh castShadow material={materials.metalSteel}>
        <cylinderGeometry args={[0.22, 0.22, 2.1, seg]} />
      </mesh>

      {/* Knurl bands on the handle */}
      {[-0.45, -0.15, 0.15, 0.45].map((y, i) => (
        <mesh key={`knurl-${i}`} position={[0, y, 0]} material={materials.metalDark}>
          <cylinderGeometry args={[0.235, 0.235, 0.12, seg]} />
        </mesh>
      ))}

      {/* Collars */}
      {[-1, 1].map((side) => (
        <mesh
          key={`collar-${side}`}
          position={[0, side * 0.98, 0]}
          material={materials.metalDark}
        >
          <cylinderGeometry args={[0.4, 0.34, 0.28, seg]} />
        </mesh>
      ))}

      {/* Plates (rotated group is along Y, so use y for offset) */}
      {plates.map((p, i) => (
        <group key={`plate-${i}`} position={[0, p.x, 0]}>
          <mesh castShadow material={p.mat}>
            <cylinderGeometry args={[p.r, p.r, p.t, seg]} />
          </mesh>
          {p.accentRing && (
            <mesh material={materials.accent} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[p.r * 0.92, 0.03, 8, seg]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export default Dumbbell;
