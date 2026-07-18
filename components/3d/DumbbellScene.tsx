"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { assetUrl } from "@/lib/base-path";
import { MODEL_CYCLE_MS, SCENE_MODELS } from "@/lib/scene-models";

export interface SceneHandle {
  group: THREE.Group | null;
}

interface DumbbellSceneProps {
  lowPoly?: boolean;
  onReady?: (handle: SceneHandle) => void;
}

type PreparedModel = {
  root: THREE.Group;
};

type SlidePhase = "idle" | "out" | "in";

/**
 * Imperative Three.js stage — cycles gym GLBs.
 * Slide is outside the spin so motion is always screen-right.
 * Dumbbell stays at 45°; other models stay upright.
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
    let cycleTimer: ReturnType<typeof setInterval> | null = null;
    let modelIndex = 0;
    let pendingIndex: number | null = null;
    let slidePhase: SlidePhase = "idle";
    let slideDistance = 8;
    const prepared: (PreparedModel | null)[] = SCENE_MODELS.map(() => null);

    const scene = new THREE.Scene();
    const isMobile = window.innerWidth < 768;

    const camera = new THREE.PerspectiveCamera(isMobile ? 42 : 40, 1, 0.1, 80);
    camera.position.set(0, isMobile ? 0.15 : 0.35, isMobile ? 5.2 : 6.2);

    // GSAP / scroll handle — no continuous spin here
    const group = new THREE.Group();
    group.position.set(isMobile ? 0 : 1.15, isMobile ? -0.15 : 0.1, 0);
    scene.add(group);

    // Slide in world/parent X = screen-right (not affected by model spin)
    const slideRig = new THREE.Group();
    group.add(slideRig);

    // Continuous Y spin lives under the slide so “from the right” stays consistent
    const spinRig = new THREE.Group();
    slideRig.add(spinRig);

    // Multi-light rig
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

    /** Distance past the right frustum edge so the model starts fully off-screen. */
    const updateSlideDistance = () => {
      const dist = Math.abs(camera.position.z - group.position.z);
      const halfW =
        Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) *
        dist *
        camera.aspect;
      // Clear the right edge of the viewport (+ padding for model width)
      slideDistance = halfW + (isMobile ? 3.2 : 4.2) - group.position.x;
      slideDistance = Math.max(slideDistance, isMobile ? 7 : 9);
    };

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
      updateSlideDistance();
    };
    setSize();

    onReadyRef.current?.({ group });

    const spinSpeed = isMobile ? 0.24 : 0.3;

    const mountModel = (index: number, atX = 0) => {
      const next = prepared[index];
      if (!next) return;
      while (spinRig.children.length) spinRig.remove(spinRig.children[0]);
      spinRig.add(next.root);
      slideRig.position.x = atX;
      modelIndex = index;
    };

    const beginSlideTo = (index: number) => {
      if (slidePhase !== "idle" || index === modelIndex) return;
      if (!prepared[index]) return;
      pendingIndex = index;
      slidePhase = "out";
    };

    const prepareGltf = (
      gltf: { scene: THREE.Object3D },
      fitSize: number,
      opts: { rubberName?: string; tiltX?: number },
    ): PreparedModel => {
      const clone = gltf.scene.clone(true);
      const wrapper = new THREE.Group();
      const orient = new THREE.Group();
      orient.rotation.x = opts.tiltX ?? 0;

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
          if (opts.rubberName && m.name === opts.rubberName) {
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
          if (m.color && !m.map) {
            const c = m.color;
            if (c.r < 0.06 && c.g < 0.06 && c.b < 0.06) {
              m.color.set("#2a2f38");
              m.roughness = Math.min(m.roughness ?? 0.5, 0.55);
            }
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

      orient.add(clone);
      wrapper.add(orient);
      return { root: wrapper };
    };

    const loader = new GLTFLoader();
    const prevCreateImageBitmap = window.createImageBitmap;
    // @ts-expect-error intentional CSP workaround
    window.createImageBitmap = undefined;

    let cycleStarted = false;
    const startCycle = () => {
      if (cycleStarted || disposed) return;
      cycleStarted = true;
      cycleTimer = setInterval(() => {
        if (disposed || slidePhase !== "idle") return;
        const readyIdxs = prepared
          .map((p, i) => (p ? i : -1))
          .filter((i) => i >= 0);
        if (readyIdxs.length < 2) return;
        const curPos = readyIdxs.indexOf(modelIndex);
        const next =
          readyIdxs[(curPos + 1) % readyIdxs.length] ?? readyIdxs[0];
        beginSlideTo(next);
      }, MODEL_CYCLE_MS);
    };

    SCENE_MODELS.forEach((def, index) => {
      loader.load(
        assetUrl(def.src),
        (gltf) => {
          window.createImageBitmap = prevCreateImageBitmap;
          if (disposed) return;
          const fit = isMobile ? def.mobileFitSize : def.fitSize;
          prepared[index] = prepareGltf(gltf, fit, {
            rubberName: def.rubberName,
            tiltX: def.tiltX ?? 0,
          });
          if (index === 0 || spinRig.children.length === 0) {
            mountModel(index, 0);
          }
          startCycle();
        },
        undefined,
        (err) => {
          window.createImageBitmap = prevCreateImageBitmap;
          console.warn(`[NewPhase 3D] failed to load ${def.src}:`, err);
        },
      );
    });

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed || !renderer) return;
      frame = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      spinRig.rotation.y += delta * spinSpeed;

      // Always exit/enter along +X = right side of the screen
      if (slidePhase === "out") {
        slideRig.position.x = THREE.MathUtils.damp(
          slideRig.position.x,
          slideDistance,
          6.2,
          delta,
        );
        if (
          slideRig.position.x > slideDistance - 0.12 &&
          pendingIndex != null
        ) {
          // Park the next model fully off-screen right, then slide in
          mountModel(pendingIndex, slideDistance);
          pendingIndex = null;
          slidePhase = "in";
        }
      } else if (slidePhase === "in") {
        slideRig.position.x = THREE.MathUtils.damp(
          slideRig.position.x,
          0,
          6.2,
          delta,
        );
        if (Math.abs(slideRig.position.x) < 0.05) {
          slideRig.position.x = 0;
          slidePhase = "idle";
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => setSize();
    window.addEventListener("resize", onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      if (cycleTimer) clearInterval(cycleTimer);
      window.removeEventListener("resize", onResize);
      window.createImageBitmap = prevCreateImageBitmap;
      prepared.forEach((p) => {
        if (!p) return;
        p.root.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry?.dispose();
          const mats = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          mats.forEach((m) => m?.dispose?.());
        });
      });
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
