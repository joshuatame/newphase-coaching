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

    const camera = new THREE.PerspectiveCamera(isMobile ? 42 : 40, 1, 0.1, 80);
    camera.position.set(0, isMobile ? 0.15 : 0.35, isMobile ? 5.2 : 6.2);

    const group = new THREE.Group();
    // Mobile: centred + slightly larger presence; desktop: right lane
    group.position.set(isMobile ? 0 : 1.15, isMobile ? -0.15 : 0.1, 0);
    scene.add(group);

    // Multi-light rig — enough bounce that charcoal hex plates still read
    scene.add(new THREE.AmbientLight(0xe8eaee, 0.55));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2e36, 1.15));

    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(5, 7, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xdfe4ec, 1.35);
    fill.position.set(-5, 3, 2);
    scene.add(fill);

    const accent = new THREE.DirectionalLight(0xb6ff3b, 0.55);
    accent.position.set(-3, 1.5, -3);
    scene.add(accent);

    const rimL = new THREE.PointLight(0xffffff, 2.2, 18);
    rimL.position.set(-3.5, 2, 3);
    scene.add(rimL);

    const rimR = new THREE.PointLight(0xfff2d6, 2.4, 18);
    rimR.position.set(3.5, 3, 2.5);
    scene.add(rimR);

    const front = new THREE.PointLight(0xffffff, 1.8, 14);
    front.position.set(isMobile ? 0 : 1.2, 1.2, 5);
    scene.add(front);

    const under = new THREE.PointLight(0xb6ff3b, 0.85, 12);
    under.position.set(isMobile ? 0 : 1.1, -2.2, 1);
    scene.add(under);

    const spot = new THREE.SpotLight(0xfff4e0, 7.5, 32, 0.55, 0.4);
    spot.position.set(5.5, 8, 4);
    spot.target.position.set(isMobile ? 0 : -0.5, 0, 0);
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
    renderer.toneMappingExposure = 1.45;
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

    const fitSize = isMobile ? 3.6 : 3.8;
    const spinSpeed = isMobile ? 0.24 : 0.3;
    const tilt = new THREE.Group();
    tilt.rotation.x = Math.PI / 4;
    group.add(tilt);

    const loader = new GLTFLoader();
    // ImageBitmapLoader fetch()es blob: URLs; platform CSP connect-src may block that.
    // Force HTML Image path (allowed via img-src blob:) so textures always load.
    const prevCreateImageBitmap = window.createImageBitmap;
    // @ts-expect-error intentional CSP workaround
    window.createImageBitmap = undefined;

    loader.load(
      assetUrl("/models/dumbbell.glb"),
      (gltf) => {
        window.createImageBitmap = prevCreateImageBitmap;
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
            // Hex plates — charcoal black that still catches multi-light rims
            if (m.name === "Rubber_Black") {
              m.color.set("#1e2229");
              m.roughness = 0.48;
              m.metalness = 0.12;
              if (m.emissive) {
                m.emissive.set("#0b0d11");
                m.emissiveIntensity = 0.08;
              }
              m.needsUpdate = true;
              return;
            }
            if (m.emissive) {
              m.emissive.set("#0a0c10");
              m.emissiveIntensity = 0.1;
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
        window.createImageBitmap = prevCreateImageBitmap;
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
