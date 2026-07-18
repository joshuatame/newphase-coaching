/** Public 3D model for the marketing site. */
export type SceneModelDef = {
  id: string;
  label: string;
  src: string;
  fitSize: number;
  mobileFitSize: number;
  rubberName?: string;
  /** Pitch tilt in radians. */
  tiltX?: number;
};

export const SCENE_MODEL: SceneModelDef = {
  id: "dumbbell",
  label: "Hex Dumbbell",
  src: "/models/dumbbell.glb",
  fitSize: 3.8,
  mobileFitSize: 2.15,
  rubberName: "Rubber_Black",
  tiltX: Math.PI / 4,
};
