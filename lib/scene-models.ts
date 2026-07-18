/** Public 3D models cycled on the marketing site. */
export type SceneModelDef = {
  id: string;
  label: string;
  src: string;
  fitSize: number;
  mobileFitSize: number;
  rubberName?: string;
};

export const SCENE_MODELS: SceneModelDef[] = [
  {
    id: "dumbbell",
    label: "Hex Dumbbell",
    src: "/models/dumbbell.glb",
    fitSize: 3.8,
    mobileFitSize: 3.6,
    rubberName: "Rubber_Black",
  },
  {
    id: "gym-weights",
    label: "Gym Weights",
    src: "/models/gym-weights.glb",
    fitSize: 3.4,
    mobileFitSize: 3.2,
  },
  {
    id: "supplements",
    label: "Supplements",
    src: "/models/supplements.glb",
    fitSize: 3.2,
    mobileFitSize: 3.0,
  },
  {
    id: "weight-room",
    label: "Weight Room",
    src: "/models/weight-room.glb",
    fitSize: 3.6,
    mobileFitSize: 3.3,
  },
];

export const MODEL_CYCLE_MS = 4000;
