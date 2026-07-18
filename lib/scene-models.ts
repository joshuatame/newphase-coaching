/** Public 3D models cycled on the marketing site. */
export type SceneModelDef = {
  id: string;
  label: string;
  src: string;
  fitSize: number;
  mobileFitSize: number;
  rubberName?: string;
  /** Pitch tilt in radians. Dumbbell uses 45°; others stay upright (0). */
  tiltX?: number;
};

export const SCENE_MODELS: SceneModelDef[] = [
  {
    id: "dumbbell",
    label: "Hex Dumbbell",
    src: "/models/dumbbell.glb",
    fitSize: 3.8,
    mobileFitSize: 2.15,
    rubberName: "Rubber_Black",
    tiltX: Math.PI / 4,
  },
  {
    id: "gym-weights",
    label: "Gym Weights",
    src: "/models/gym-weights.glb",
    fitSize: 3.4,
    mobileFitSize: 1.95,
    tiltX: 0,
  },
  {
    id: "supplements",
    label: "Supplements",
    src: "/models/supplements.glb",
    fitSize: 3.2,
    mobileFitSize: 1.85,
    tiltX: 0,
  },
  {
    id: "weight-room",
    label: "Weight Room",
    src: "/models/weight-room.glb",
    fitSize: 3.6,
    mobileFitSize: 2.05,
    tiltX: 0,
  },
];

export const MODEL_CYCLE_MS = 4000;
