"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { assetUrl } from "@/lib/base-path";

export interface SceneHandle {
  group: THREE.Group | null;
}

interface DumbbellSceneProps {
  lowPoly?: boolean;
  onReady?: (handle: SceneHandle) => void;
}

/**
 * Imperative Three.js scene (no R3F).
 * Avoids Next 15 duplicate-React crash: ReactCurrentBatchConfig.
 */
export function DumbbellScene({
  lowPoly = false,
  onReady,
}: DumbbellSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let modelRoot: THREE.Group | null = null;

    const scene = new THREE.Scene();
    const isMobile = window.innerWidth < 768;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 80);
    camera.position.set(0, 0.35, 6.2);

    const group = new THREE.Group();
    group.position.set(isMobile ? 0 : 1.15, isMobile ? 0.05 : 0.1, 0);
    scene.add(group);

    // Lights — bright enough without an HDR environment map
    scene.add(new THREE.AmbientLight(0xf2f3f5, 1.1));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1d23, 0.9));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 6, 3);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xb6ff3b, 0.75);
    fill.position.set(-4, 2, -2);
    scene.add(fill);

    const rim = new THREE.PointLight(0xffffff, 1.7, 16);
    rim.position.set(0, 2.5, 4);
    scene.add(rim);

    const spot = new THREE.SpotLight(0xfff4e0, 6, 30, 0.5, 0.45);
    spot.position.set(5.5, 8, 4);
    spot.target.position.set(-0.8, 0, 0);
    scene.add(spot);
    scene.add(spot.target);

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lowPoly,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch (err) {
      console.warn("[NewPhase 3D] WebGLRenderer failed:", err);
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, lowPoly ? 1.25 : 1.6),
    );
    host.appendChild(renderer.domElement);

    const setSize = () => {
      if (!renderer || !host) return;
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
    };
    setSize();

    onReadyRef.current?.({ group });

    const fitSize = isMobile ? 3.1 : 3.8;
    const spinSpeed = isMobile ? 0.24 : 0.3;
    const tilt = new THREE.Group();
    tilt.rotation.x = Math.PI / 4;
    group.add(tilt);

    const loader = new GLTFLoader();
    loader.load(
      assetUrl("/models/dumbbell.glb"),
      (gltf) => {
        if (disposed) return;
        const clone = gltf.scene.clone(true);

        clone.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
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
              if (c.r < 0.12 && c.g < 0.12 && c.b < 0.12) {
                m.color.set("#5a6270");
                m.roughness = 0.45;
                m.metalness = 0.15;
              }
            }
            if (m.emissive) {
              m.emissive.set("#12151a");
              m.emissiveIntensity = 0.25;
            }
            m.needsUpdate = true;
          });
        });

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

        tilt.add(clone);
        modelRoot = clone;
      },
      undefined,
      (err) => {
        console.warn("[NewPhase 3D] GLB load failed:", err);
      },
    );

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed || !renderer) return;
      frame = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      group.rotation.y += delta * spinSpeed;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => setSize();
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      if (modelRoot) {
        tilt.remove(modelRoot);
        modelRoot.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry?.dispose();
            const mats = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            mats.forEach((m) => m?.dispose?.());
          }
        });
      }
      renderer?.dispose();
      if (renderer?.domElement?.parentElement === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [lowPoly]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 h-full w-full"
      style={{ background: "transparent" }}
    />
  );
}

export default DumbbellScene;
