"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

type BodyModel = "male" | "female";
type TrainingFocus =
  | "balanced"
  | "v_taper"
  | "upper_push"
  | "lower_body"
  | "recomp_strength";
type WorkoutSplit = "full_body" | "upper_lower" | "ppl" | "specialization";
type CalorieTarget = "cut" | "maintain" | "lean_gain";
type ProteinLevel = "baseline" | "target" | "high";
type ConsistencyLevel = "steady" | "high" | "locked";
type TimeframeId = "8w" | "12w" | "24w";
type BodyView = "front" | "back";
type MuscleKey =
  | "shoulders"
  | "chest"
  | "arms"
  | "core"
  | "thighs"
  | "calves"
  | "upperBack"
  | "lats"
  | "glutes"
  | "hamstrings";
type StrengthMetricKey =
  | "bench_press"
  | "incline_press"
  | "overhead_press"
  | "barbell_row"
  | "pull_ups"
  | "high_bar_squat"
  | "romanian_deadlift"
  | "hip_thrust";
type SimulatorTabId = "setup" | "body" | "metrics" | "insights";

interface BodyMetrics {
  weight: number;
  bodyFat: number;
  leanMass: number;
  shoulders: number;
  chest: number;
  arms: number;
  waist: number;
  thighs: number;
}

interface StrengthMetricResult {
  key: StrengthMetricKey;
  label: string;
  unit: "lb" | "reps";
  current: number;
  projected: number;
}

interface TimelinePoint {
  label: string;
  week: number;
  weight: number;
  bodyFat: number;
  leanMass: number;
}

interface SimulationConfig {
  bodyModel: BodyModel;
  trainingFocus: TrainingFocus;
  workoutSplit: WorkoutSplit;
  calorieTarget: CalorieTarget;
  proteinLevel: ProteinLevel;
  consistency: ConsistencyLevel;
  timeframe: TimeframeId;
}

interface SimulationResult {
  current: BodyMetrics;
  projected: BodyMetrics;
  strengthMetrics: StrengthMetricResult[];
  currentMap: Record<MuscleKey, number>;
  projectedMap: Record<MuscleKey, number>;
  currentScale: Record<MuscleKey, number>;
  projectedScale: Record<MuscleKey, number>;
  modelFactors: {
    volume: number;
    intensity: number;
    frequency: number;
    recovery: number;
    fatigue: number;
  };
  insights: Array<{
    title: string;
    body: string;
  }>;
  topChanges: Array<{
    label: string;
    deltaPercent: number;
  }>;
  timeline: TimelinePoint[];
  timeframeLabel: string;
}

const defaultConfig: SimulationConfig = {
  bodyModel: "male",
  trainingFocus: "balanced",
  workoutSplit: "upper_lower",
  calorieTarget: "maintain",
  proteinLevel: "target",
  consistency: "high",
  timeframe: "12w",
};

const simulatorTabs = [
  { id: "setup", label: "Setup", glyph: "●" },
  { id: "body", label: "Body", glyph: "◐" },
  { id: "metrics", label: "Metrics", glyph: "▣" },
  { id: "insights", label: "Insights", glyph: "✦" },
] as const;

const bodyModelOptions = [
  { id: "male", label: "Male", caption: "Upper-body baseline" },
  { id: "female", label: "Female", caption: "Lower-body baseline" },
] as const;

const trainingFocusOptions = [
  { id: "balanced", label: "Balanced", caption: "Even development" },
  { id: "v_taper", label: "V-Taper", caption: "Delts and lats" },
  { id: "upper_push", label: "Chest + Arms", caption: "Push emphasis" },
  { id: "lower_body", label: "Lower Body", caption: "Glutes and legs" },
  { id: "recomp_strength", label: "Strength Recomp", caption: "Lean compounds" },
] as const;

const workoutSplitOptions = [
  { id: "full_body", label: "Full Body 3x", caption: "Lower fatigue" },
  { id: "upper_lower", label: "Upper / Lower 4x", caption: "Balanced" },
  { id: "ppl", label: "Push Pull Legs 5x", caption: "Higher volume" },
  { id: "specialization", label: "Specialization 5x", caption: "Most focused" },
] as const;

const calorieOptions = [
  { id: "cut", label: "Cut", caption: "Fat loss bias" },
  { id: "maintain", label: "Maintain", caption: "Recomp bias" },
  { id: "lean_gain", label: "Lean Gain", caption: "Small surplus" },
] as const;

const proteinOptions = [
  { id: "baseline", label: "Adequate", caption: "Good enough" },
  { id: "target", label: "Strong", caption: "Growth support" },
  { id: "high", label: "Optimized", caption: "Best recovery" },
] as const;

const consistencyOptions = [
  { id: "steady", label: "Low", caption: "Inconsistent" },
  { id: "high", label: "Medium", caption: "Mostly on plan" },
  { id: "locked", label: "High", caption: "Very consistent" },
] as const;

const timeframeOptions = [
  { id: "8w", label: "8 Weeks", weeks: 8 },
  { id: "12w", label: "3 Months", weeks: 12 },
  { id: "24w", label: "6 Months", weeks: 24 },
] as const;

const bodyViewOptions = [
  { id: "front", label: "Front" },
  { id: "back", label: "Back" },
] as const;

const coreMetricRows = [
  { key: "weight", label: "Body Weight", unit: "lb", positiveIsGood: true },
  { key: "bodyFat", label: "Body Fat", unit: "%", positiveIsGood: false },
  { key: "leanMass", label: "Lean Mass", unit: "lb", positiveIsGood: true },
  { key: "shoulders", label: "Shoulders", unit: "in", positiveIsGood: true },
  { key: "chest", label: "Chest", unit: "in", positiveIsGood: true },
  { key: "arms", label: "Arms", unit: "in", positiveIsGood: true },
  { key: "waist", label: "Waist", unit: "in", positiveIsGood: false },
  { key: "thighs", label: "Thighs", unit: "in", positiveIsGood: true },
] as const satisfies ReadonlyArray<{
  key: keyof BodyMetrics;
  label: string;
  unit: string;
  positiveIsGood: boolean;
}>;

const chartDefinitions = [
  { key: "weight", label: "Weight", accent: "#67e8f9" },
  { key: "leanMass", label: "Lean Mass", accent: "#86efac" },
  { key: "bodyFat", label: "Body Fat", accent: "#fbbf24" },
] as const;

const muscleLabels: Record<MuscleKey, string> = {
  shoulders: "Shoulders",
  chest: "Chest",
  arms: "Arms",
  core: "Waist",
  thighs: "Thighs",
  calves: "Calves",
  upperBack: "Upper Back",
  lats: "Lats",
  glutes: "Glutes",
  hamstrings: "Hamstrings",
};

const baseStateByModel = {
  male: {
    weight: 178,
    bodyFat: 18.4,
    shoulders: 49.2,
    chest: 40.6,
    arms: 14.4,
    waist: 33.2,
    thighs: 23.3,
    minFatMass: 17.8,
    maxFatMass: 40.0,
  },
  female: {
    weight: 138,
    bodyFat: 25.6,
    shoulders: 42.6,
    chest: 36.2,
    arms: 12.2,
    waist: 29.1,
    thighs: 23.1,
    minFatMass: 24.8,
    maxFatMass: 42.0,
  },
} as const;

const baseBodyMap: Record<BodyModel, Record<MuscleKey, number>> = {
  male: {
    shoulders: 0.4,
    chest: 0.39,
    arms: 0.35,
    core: 0.3,
    thighs: 0.39,
    calves: 0.28,
    upperBack: 0.38,
    lats: 0.39,
    glutes: 0.32,
    hamstrings: 0.34,
  },
  female: {
    shoulders: 0.32,
    chest: 0.31,
    arms: 0.29,
    core: 0.31,
    thighs: 0.44,
    calves: 0.3,
    upperBack: 0.31,
    lats: 0.32,
    glutes: 0.45,
    hamstrings: 0.41,
  },
};

const focusProfiles: Record<
  TrainingFocus,
  {
    volume: number;
    intensity: number;
    frequency: number;
    emphasis: Record<MuscleKey, number>;
    metricKeys: StrengthMetricKey[];
  }
> = {
  balanced: {
    volume: 0.66,
    intensity: 0.62,
    frequency: 0.68,
    metricKeys: ["bench_press", "high_bar_squat", "barbell_row"],
    emphasis: {
      shoulders: 0.58,
      chest: 0.58,
      arms: 0.55,
      core: 0.46,
      thighs: 0.56,
      calves: 0.36,
      upperBack: 0.55,
      lats: 0.56,
      glutes: 0.56,
      hamstrings: 0.5,
    },
  },
  v_taper: {
    volume: 0.73,
    intensity: 0.67,
    frequency: 0.71,
    metricKeys: ["overhead_press", "pull_ups", "incline_press"],
    emphasis: {
      shoulders: 0.92,
      chest: 0.54,
      arms: 0.63,
      core: 0.55,
      thighs: 0.34,
      calves: 0.24,
      upperBack: 0.76,
      lats: 0.9,
      glutes: 0.3,
      hamstrings: 0.28,
    },
  },
  upper_push: {
    volume: 0.72,
    intensity: 0.69,
    frequency: 0.68,
    metricKeys: ["bench_press", "overhead_press", "incline_press"],
    emphasis: {
      shoulders: 0.74,
      chest: 0.9,
      arms: 0.82,
      core: 0.42,
      thighs: 0.3,
      calves: 0.18,
      upperBack: 0.46,
      lats: 0.38,
      glutes: 0.24,
      hamstrings: 0.22,
    },
  },
  lower_body: {
    volume: 0.74,
    intensity: 0.7,
    frequency: 0.69,
    metricKeys: ["high_bar_squat", "romanian_deadlift", "hip_thrust"],
    emphasis: {
      shoulders: 0.28,
      chest: 0.24,
      arms: 0.24,
      core: 0.44,
      thighs: 0.9,
      calves: 0.54,
      upperBack: 0.34,
      lats: 0.3,
      glutes: 0.92,
      hamstrings: 0.82,
    },
  },
  recomp_strength: {
    volume: 0.58,
    intensity: 0.8,
    frequency: 0.62,
    metricKeys: ["bench_press", "high_bar_squat", "romanian_deadlift"],
    emphasis: {
      shoulders: 0.48,
      chest: 0.5,
      arms: 0.42,
      core: 0.52,
      thighs: 0.62,
      calves: 0.34,
      upperBack: 0.55,
      lats: 0.52,
      glutes: 0.6,
      hamstrings: 0.56,
    },
  },
};

const splitProfiles: Record<
  WorkoutSplit,
  {
    volume: number;
    intensity: number;
    frequency: number;
    fatigue: number;
  }
> = {
  full_body: {
    volume: 0.56,
    intensity: 0.62,
    frequency: 0.7,
    fatigue: 0.34,
  },
  upper_lower: {
    volume: 0.66,
    intensity: 0.67,
    frequency: 0.72,
    fatigue: 0.44,
  },
  ppl: {
    volume: 0.76,
    intensity: 0.7,
    frequency: 0.7,
    fatigue: 0.58,
  },
  specialization: {
    volume: 0.84,
    intensity: 0.69,
    frequency: 0.78,
    fatigue: 0.68,
  },
};

const calorieProfiles: Record<
  CalorieTarget,
  {
    muscleSupport: number;
    weeklyFatChange: number;
    recoveryBoost: number;
    strengthSupport: number;
    label: string;
  }
> = {
  cut: {
    muscleSupport: 0.58,
    weeklyFatChange: -0.34,
    recoveryBoost: -0.08,
    strengthSupport: 0.92,
    label: "deficit",
  },
  maintain: {
    muscleSupport: 0.8,
    weeklyFatChange: 0.02,
    recoveryBoost: 0.04,
    strengthSupport: 1,
    label: "maintenance",
  },
  lean_gain: {
    muscleSupport: 1.02,
    weeklyFatChange: 0.14,
    recoveryBoost: 0.12,
    strengthSupport: 1.06,
    label: "small surplus",
  },
};

const proteinProfiles: Record<
  ProteinLevel,
  {
    anabolic: number;
    recovery: number;
  }
> = {
  baseline: {
    anabolic: 0.86,
    recovery: 0.84,
  },
  target: {
    anabolic: 1,
    recovery: 1,
  },
  high: {
    anabolic: 1.08,
    recovery: 1.08,
  },
};

const consistencyProfiles: Record<
  ConsistencyLevel,
  {
    factor: number;
    recovery: number;
    fatigueBuffer: number;
    label: string;
  }
> = {
  steady: {
    factor: 0.72,
    recovery: 0.78,
    fatigueBuffer: 0.7,
    label: "lower consistency",
  },
  high: {
    factor: 0.84,
    recovery: 0.9,
    fatigueBuffer: 0.82,
    label: "solid consistency",
  },
  locked: {
    factor: 0.94,
    recovery: 0.98,
    fatigueBuffer: 0.94,
    label: "high consistency",
  },
};

const timeframeProfiles = {
  "8w": { label: "8 weeks", weeks: 8 },
  "12w": { label: "3 months", weeks: 12 },
  "24w": { label: "6 months", weeks: 24 },
} as const;

const strengthMetricsCatalog: Record<
  StrengthMetricKey,
  {
    label: string;
    unit: "lb" | "reps";
    baseline: Record<BodyModel, number>;
    muscles: Partial<Record<MuscleKey, number>>;
  }
> = {
  bench_press: {
    label: "Bench",
    unit: "lb",
    baseline: { male: 185, female: 95 },
    muscles: { chest: 0.58, shoulders: 0.22, arms: 0.2 },
  },
  incline_press: {
    label: "Incline",
    unit: "lb",
    baseline: { male: 155, female: 80 },
    muscles: { chest: 0.42, shoulders: 0.38, arms: 0.2 },
  },
  overhead_press: {
    label: "OHP",
    unit: "lb",
    baseline: { male: 115, female: 65 },
    muscles: { shoulders: 0.65, arms: 0.2, core: 0.15 },
  },
  barbell_row: {
    label: "Row",
    unit: "lb",
    baseline: { male: 165, female: 95 },
    muscles: { upperBack: 0.34, lats: 0.4, arms: 0.18, core: 0.08 },
  },
  pull_ups: {
    label: "Pull-Ups",
    unit: "reps",
    baseline: { male: 8, female: 3 },
    muscles: { lats: 0.5, upperBack: 0.25, arms: 0.2, core: 0.05 },
  },
  high_bar_squat: {
    label: "Squat",
    unit: "lb",
    baseline: { male: 255, female: 165 },
    muscles: { thighs: 0.46, glutes: 0.28, core: 0.14, calves: 0.12 },
  },
  romanian_deadlift: {
    label: "RDL",
    unit: "lb",
    baseline: { male: 275, female: 175 },
    muscles: { hamstrings: 0.36, glutes: 0.28, upperBack: 0.2, core: 0.16 },
  },
  hip_thrust: {
    label: "Hip Thrust",
    unit: "lb",
    baseline: { male: 315, female: 225 },
    muscles: { glutes: 0.56, hamstrings: 0.18, thighs: 0.18, core: 0.08 },
  },
};

const anatomyRegions = {
  front: [
    {
      key: "shoulders",
      anchor: { x: 90, y: 88 },
      shapes: [
        {
          type: "path",
          d: "M47 78 C52 67 65 62 77 67 C72 77 69 88 67 99 C58 98 51 92 47 78 Z",
        },
        {
          type: "path",
          d: "M133 78 C128 67 115 62 103 67 C108 77 111 88 113 99 C122 98 129 92 133 78 Z",
        },
      ],
    },
    {
      key: "chest",
      anchor: { x: 90, y: 114 },
      shapes: [
        {
          type: "path",
          d: "M65 88 C76 84 86 88 91 101 L86 135 C77 138 66 132 61 122 C58 110 60 96 65 88 Z",
        },
        {
          type: "path",
          d: "M115 88 C104 84 94 88 89 101 L94 135 C103 138 114 132 119 122 C122 110 120 96 115 88 Z",
        },
      ],
    },
    {
      key: "arms",
      anchor: { x: 90, y: 155 },
      shapes: [
        {
          type: "path",
          d: "M46 96 C37 105 31 118 30 134 C31 154 36 176 44 195 C49 202 58 201 61 193 C57 173 56 154 57 136 C58 121 55 106 46 96 Z",
        },
        {
          type: "path",
          d: "M134 96 C143 105 149 118 150 134 C149 154 144 176 136 195 C131 202 122 201 119 193 C123 173 124 154 123 136 C122 121 125 106 134 96 Z",
        },
      ],
    },
    {
      key: "core",
      anchor: { x: 90, y: 160 },
      shapes: [
        {
          type: "path",
          d: "M71 127 C77 116 86 111 90 111 C94 111 103 116 109 127 L108 154 C106 170 103 187 100 205 C98 214 93 219 90 219 C87 219 82 214 80 205 C77 187 74 170 72 154 Z",
        },
      ],
    },
    {
      key: "thighs",
      anchor: { x: 90, y: 245 },
      shapes: [
        {
          type: "path",
          d: "M72 210 C81 207 88 215 89 228 L87 274 C84 294 77 309 68 313 C62 302 58 286 58 267 C59 243 62 219 72 210 Z",
        },
        {
          type: "path",
          d: "M108 210 C99 207 92 215 91 228 L93 274 C96 294 103 309 112 313 C118 302 122 286 122 267 C121 243 118 219 108 210 Z",
        },
      ],
    },
    {
      key: "calves",
      anchor: { x: 90, y: 314 },
      shapes: [
        {
          type: "path",
          d: "M69 296 C76 292 81 299 81 312 C81 327 78 339 72 347 C65 343 62 333 62 320 C62 309 64 300 69 296 Z",
        },
        {
          type: "path",
          d: "M111 296 C104 292 99 299 99 312 C99 327 102 339 108 347 C115 343 118 333 118 320 C118 309 116 300 111 296 Z",
        },
      ],
    },
  ],
  back: [
    {
      key: "shoulders",
      anchor: { x: 90, y: 87 },
      shapes: [
        {
          type: "path",
          d: "M48 80 C52 68 64 63 77 67 C72 77 70 88 69 98 C58 97 50 91 48 80 Z",
        },
        {
          type: "path",
          d: "M132 80 C128 68 116 63 103 67 C108 77 110 88 111 98 C122 97 130 91 132 80 Z",
        },
      ],
    },
    {
      key: "upperBack",
      anchor: { x: 90, y: 110 },
      shapes: [
        {
          type: "path",
          d: "M70 74 C79 70 101 70 110 74 C116 85 118 101 115 120 C110 134 100 143 90 145 C80 143 70 134 65 120 C62 101 64 85 70 74 Z",
        },
      ],
    },
    {
      key: "lats",
      anchor: { x: 90, y: 144 },
      shapes: [
        {
          type: "path",
          d: "M63 112 C72 105 82 107 87 121 L82 188 C72 197 60 188 56 172 C54 150 55 122 63 112 Z",
        },
        {
          type: "path",
          d: "M117 112 C108 105 98 107 93 121 L98 188 C108 197 120 188 124 172 C126 150 125 122 117 112 Z",
        },
      ],
    },
    {
      key: "arms",
      anchor: { x: 90, y: 156 },
      shapes: [
        {
          type: "path",
          d: "M46 98 C38 108 33 121 32 138 C33 159 39 181 48 198 C53 204 61 201 63 192 C57 174 55 156 56 138 C56 123 54 108 46 98 Z",
        },
        {
          type: "path",
          d: "M134 98 C142 108 147 121 148 138 C147 159 141 181 132 198 C127 204 119 201 117 192 C123 174 125 156 124 138 C124 123 126 108 134 98 Z",
        },
      ],
    },
    {
      key: "glutes",
      anchor: { x: 90, y: 216 },
      shapes: [
        {
          type: "path",
          d: "M67 196 C77 194 86 201 88 214 C88 226 84 235 77 241 C68 236 62 225 62 213 C62 205 64 199 67 196 Z",
        },
        {
          type: "path",
          d: "M113 196 C103 194 94 201 92 214 C92 226 96 235 103 241 C112 236 118 225 118 213 C118 205 116 199 113 196 Z",
        },
      ],
    },
    {
      key: "hamstrings",
      anchor: { x: 90, y: 252 },
      shapes: [
        {
          type: "path",
          d: "M72 224 C80 223 86 231 86 244 L84 291 C81 306 74 317 67 320 C61 311 58 297 58 281 C59 255 62 231 72 224 Z",
        },
        {
          type: "path",
          d: "M108 224 C100 223 94 231 94 244 L96 291 C99 306 106 317 113 320 C119 311 122 297 122 281 C121 255 118 231 108 224 Z",
        },
      ],
    },
    {
      key: "calves",
      anchor: { x: 90, y: 314 },
      shapes: [
        {
          type: "path",
          d: "M69 298 C76 294 81 300 81 313 C81 328 78 340 72 348 C65 344 62 334 62 321 C62 310 64 301 69 298 Z",
        },
        {
          type: "path",
          d: "M111 298 C104 294 99 300 99 313 C99 328 102 340 108 348 C115 344 118 334 118 321 C118 310 116 301 111 298 Z",
        },
      ],
    },
  ],
} as const;

const anatomyShellPaths = {
  front: {
    head:
      "M90 18 C81 18 74 25 74 34 C74 44 81 52 90 52 C99 52 106 44 106 34 C106 25 99 18 90 18 Z",
    neck:
      "M82 51 C83 58 85 64 86 69 L94 69 C95 64 97 58 98 51 C95 54 85 54 82 51 Z",
    body:
      "M70 68 C60 70 50 77 45 90 C39 106 35 125 34 142 C34 159 37 178 44 194 C49 205 56 209 59 217 C61 226 61 239 60 255 C59 280 60 308 67 344 L78 344 C81 321 83 293 83 266 C83 245 86 227 90 218 C94 227 97 245 97 266 C97 293 99 321 102 344 L113 344 C120 308 121 280 120 255 C119 239 119 226 121 217 C124 209 131 205 136 194 C143 178 146 159 146 142 C145 125 141 106 135 90 C130 77 120 70 110 68 C104 85 98 102 90 112 C82 102 76 85 70 68 Z",
  },
  back: {
    head:
      "M90 18 C81 18 74 25 74 34 C74 44 81 52 90 52 C99 52 106 44 106 34 C106 25 99 18 90 18 Z",
    neck:
      "M82 51 C84 58 85 64 86 69 L94 69 C95 64 96 58 98 51 C96 55 84 55 82 51 Z",
    body:
      "M70 68 C60 71 50 78 45 92 C39 108 35 126 35 145 C36 162 39 179 45 194 C50 205 57 210 61 218 C63 229 63 241 61 257 C59 281 61 309 68 344 L79 344 C82 323 84 295 84 268 C84 248 87 230 90 220 C93 230 96 248 96 268 C96 295 98 323 101 344 L112 344 C119 309 121 281 119 257 C117 241 117 229 119 218 C123 210 130 205 135 194 C141 179 144 162 145 145 C145 126 141 108 135 92 C130 78 120 71 110 68 C104 84 98 100 90 110 C82 100 76 84 70 68 Z",
  },
} as const;

const anatomyDetailPaths = {
  front: [
    "M90 69 L90 210",
    "M76 83 C81 93 84 102 86 112",
    "M104 83 C99 93 96 102 94 112",
    "M74 144 C79 150 83 160 85 173",
    "M106 144 C101 150 97 160 95 173",
    "M80 117 C76 128 75 140 76 152",
    "M100 117 C104 128 105 140 104 152",
    "M80 160 C84 166 87 176 88 187",
    "M100 160 C96 166 93 176 92 187",
    "M74 212 C75 234 74 259 70 290",
    "M106 212 C105 234 106 259 110 290",
  ],
  back: [
    "M90 69 L90 214",
    "M90 70 C83 83 79 96 78 112",
    "M90 70 C97 83 101 96 102 112",
    "M70 96 C76 114 80 133 82 154",
    "M110 96 C104 114 100 133 98 154",
    "M74 170 C77 183 79 196 80 208",
    "M106 170 C103 183 101 196 100 208",
    "M74 218 C74 241 74 266 70 292",
    "M106 218 C106 241 106 266 110 292",
  ],
} as const;

const shellBackgroundStyle = {
  backgroundImage:
    "radial-gradient(circle at 12% 0%,rgba(97,255,216,0.18),transparent 24%), radial-gradient(circle at 86% 14%,rgba(111,176,255,0.18),transparent 22%), linear-gradient(180deg,#030609 0%,#071018 54%,#0a141d 100%)",
} as const;

export function FitnessSimulatorApp() {
  const [draftConfig, setDraftConfig] = useState<SimulationConfig>(defaultConfig);
  const [appliedConfig, setAppliedConfig] = useState<SimulationConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<SimulatorTabId>("body");
  const [bodyView, setBodyView] = useState<BodyView>("front");
  const [simulationVersion, setSimulationVersion] = useState(0);

  const simulation = simulatePhysique(appliedConfig);

  function updateDraft<K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) {
    setDraftConfig((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function runSimulation() {
    setAppliedConfig(draftConfig);
    setSimulationVersion((current) => current + 1);
    setActiveTab("body");
  }

  return (
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden text-white"
      style={shellBackgroundStyle}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_34%)]" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="border-b border-white/10 px-5 pb-4 pt-5 backdrop-blur-[18px]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-cyan-100/46">
                Fitness Intelligence
              </p>
              <h1 className="mt-2 text-[1.95rem] font-semibold tracking-[-0.07em] text-white">
                Physique Simulator
              </h1>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-white/56">
              Projection
            </span>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="h-full overflow-y-auto px-5 pb-28 pt-5"
            >
              {activeTab === "setup" ? (
                <SetupTab
                  config={draftConfig}
                  appliedConfig={appliedConfig}
                  onChange={updateDraft}
                  onRunSimulation={runSimulation}
                />
              ) : activeTab === "body" ? (
                <BodyTab
                  key={`${appliedConfig.timeframe}-${simulationVersion}`}
                  simulation={simulation}
                  bodyModel={appliedConfig.bodyModel}
                  bodyView={bodyView}
                  onChangeBodyView={setBodyView}
                />
              ) : activeTab === "metrics" ? (
                <MetricsTab simulation={simulation} />
              ) : (
                <InsightsTab
                  simulation={simulation}
                  config={appliedConfig}
                  onOpenSetup={() => setActiveTab("setup")}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <SimulatorTabBar activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
}

function SetupTab({
  config,
  appliedConfig,
  onChange,
  onRunSimulation,
}: {
  config: SimulationConfig;
  appliedConfig: SimulationConfig;
  onChange: <K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) => void;
  onRunSimulation: () => void;
}) {
  const hasPendingChanges =
    JSON.stringify(config) !== JSON.stringify(appliedConfig);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_54px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/50">
              Setup
            </p>
            <p className="mt-2 text-[0.82rem] leading-6 text-white/72">
              Pick the setup, then run the projection.
            </p>
          </div>
          {hasPendingChanges ? (
            <span className="rounded-full border border-cyan-200/18 bg-cyan-200/10 px-3 py-1 text-[0.58rem] uppercase tracking-[0.18em] text-cyan-50/82">
              Updated
            </span>
          ) : null}
        </div>
      </section>

      <SetupSection title="Body Model">
        <SegmentGrid
          columns={2}
          options={bodyModelOptions}
          activeId={config.bodyModel}
          onChange={(value) => onChange("bodyModel", value as BodyModel)}
        />
      </SetupSection>

      <SetupSection title="Timeframe">
        <SegmentGrid
          columns={3}
          options={timeframeOptions.map((option) => ({
            id: option.id,
            label: option.label,
            caption: `${option.weeks} weeks`,
          }))}
          activeId={config.timeframe}
          onChange={(value) => onChange("timeframe", value as TimeframeId)}
        />
      </SetupSection>

      <SetupSection title="Training Focus">
        <SegmentGrid
          columns={2}
          options={trainingFocusOptions}
          activeId={config.trainingFocus}
          onChange={(value) => onChange("trainingFocus", value as TrainingFocus)}
        />
      </SetupSection>

      <SetupSection title="Split">
        <SegmentGrid
          columns={2}
          options={workoutSplitOptions}
          activeId={config.workoutSplit}
          onChange={(value) => onChange("workoutSplit", value as WorkoutSplit)}
        />
      </SetupSection>

      <SetupSection title="Nutrition">
        <SegmentGrid
          columns={3}
          options={calorieOptions}
          activeId={config.calorieTarget}
          onChange={(value) => onChange("calorieTarget", value as CalorieTarget)}
        />
      </SetupSection>

      <SetupSection title="Protein">
        <SegmentGrid
          columns={3}
          options={proteinOptions}
          activeId={config.proteinLevel}
          onChange={(value) => onChange("proteinLevel", value as ProteinLevel)}
        />
      </SetupSection>

      <SetupSection title="Consistency">
        <SegmentGrid
          columns={3}
          options={consistencyOptions}
          activeId={config.consistency}
          onChange={(value) => onChange("consistency", value as ConsistencyLevel)}
        />
      </SetupSection>

      <button
        type="button"
        onClick={onRunSimulation}
        className="w-full rounded-[1.45rem] border border-cyan-200/24 bg-[linear-gradient(135deg,rgba(121,255,224,0.22),rgba(103,138,255,0.16))] px-4 py-4 text-sm font-semibold tracking-[0.02em] text-white shadow-[0_20px_42px_rgba(53,125,171,0.24)] transition hover:border-cyan-100/34 hover:bg-[linear-gradient(135deg,rgba(121,255,224,0.28),rgba(103,138,255,0.18))]"
      >
        Run Simulation
      </button>

      <p className="px-1 text-[0.68rem] leading-5 text-white/44">
        Simulation only. These are training projections, not medical claims.
      </p>
    </div>
  );
}

function BodyTab({
  simulation,
  bodyModel,
  bodyView,
  onChangeBodyView,
}: {
  simulation: SimulationResult;
  bodyModel: BodyModel;
  bodyView: BodyView;
  onChangeBodyView: (view: BodyView) => void;
}) {
  const [compareProgress, setCompareProgress] = useState(100);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] px-4 pb-4 pt-4 shadow-[0_24px_54px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/48">
              Body Projection
            </p>
            <p className="mt-2 text-[0.82rem] leading-6 text-white/72">
              Drag between baseline and projection over {simulation.timeframeLabel}.
            </p>
          </div>

          <div className="rounded-[1.05rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-1.5 backdrop-blur-[18px]">
            <div className="flex items-center gap-1">
              {bodyViewOptions.map((option) => {
                const active = option.id === bodyView;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onChangeBodyView(option.id)}
                    className={`rounded-[0.9rem] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.16em] transition ${
                      active
                        ? "bg-white text-[#08111a] shadow-[0_8px_20px_rgba(255,255,255,0.16)]"
                        : "text-white/52 hover:bg-white/[0.03] hover:text-white/82"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <BodyComparisonView
          simulation={simulation}
          bodyModel={bodyModel}
          bodyView={bodyView}
          compareProgress={compareProgress}
          onChangeCompareProgress={setCompareProgress}
        />
      </section>

      <SimulationSummaryStrip simulation={simulation} />

      <section className="grid grid-cols-3 gap-2">
        {simulation.topChanges.map((change) => (
          <div
            key={change.label}
            className="rounded-[1.25rem] border border-white/10 bg-white/[0.035] px-3 py-3 text-center backdrop-blur-[18px]"
          >
            <p className="text-[0.58rem] uppercase tracking-[0.18em] text-white/38">Emphasis</p>
            <p className="mt-2 text-[0.76rem] font-semibold text-white">{change.label}</p>
            <p className="mt-1 text-[0.72rem] text-emerald-200">+{change.deltaPercent}%</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function MetricsTab({ simulation }: { simulation: SimulationResult }) {
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_54px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/48">Core Metrics</p>
        <CompactMetricTable simulation={simulation} />
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_54px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/48">Strength</p>
          <span className="text-[0.62rem] uppercase tracking-[0.18em] text-white/34">
            projected change
          </span>
        </div>

        <div className="mt-4 space-y-2.5">
          {simulation.strengthMetrics.map((metric) => (
            <StrengthDeltaRow key={metric.key} metric={metric} />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_54px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
        <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/48">Progress</p>
        <div className="mt-4 grid grid-cols-1 gap-3">
          {chartDefinitions.map((definition) => (
            <CompactTrendChart
              key={definition.key}
              label={definition.label}
              accent={definition.accent}
              points={simulation.timeline}
              values={simulation.timeline.map((point) => point[definition.key])}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function InsightsTab({
  simulation,
  config,
  onOpenSetup,
}: {
  simulation: SimulationResult;
  config: SimulationConfig;
  onOpenSetup: () => void;
}) {
  const focusLabel =
    trainingFocusOptions.find((option) => option.id === config.trainingFocus)?.label ?? "Balanced";
  const nutritionLabel =
    calorieOptions.find((option) => option.id === config.calorieTarget)?.label ?? "Maintain";

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_24px_54px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/48">Insights</p>
            <p className="mt-2 text-[0.82rem] leading-6 text-white/72">
              {focusLabel} with {nutritionLabel.toLowerCase()} over {simulation.timeframeLabel}.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSetup}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-white/58 transition hover:text-white/86"
          >
            Edit
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3">
        {simulation.insights.map((insight) => (
          <InsightCard key={insight.title} insight={insight} />
        ))}
      </div>

      <section className="grid grid-cols-2 gap-3">
        <FactorChip
          label="Recovery"
          value={simulation.modelFactors.recovery}
          accent="text-emerald-200"
        />
        <FactorChip
          label="Fatigue"
          value={simulation.modelFactors.fatigue}
          accent="text-amber-200"
        />
      </section>
    </div>
  );
}

function SimulatorTabBar({
  activeTab,
  onChange,
}: {
  activeTab: SimulatorTabId;
  onChange: (tab: SimulatorTabId) => void;
}) {
  return (
    <nav className="absolute inset-x-7 bottom-5 z-20 overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] shadow-[0_12px_28px_rgba(0,0,0,0.16)] backdrop-blur-[22px]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="absolute left-6 top-0 h-[56%] w-[34%] rounded-full bg-white/[0.1] blur-2xl" />
      <div className="relative grid grid-cols-4 gap-1 px-2 py-2">
        {simulatorTabs.map((tab) => {
          const active = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`rounded-[1.15rem] px-1 py-2.5 transition ${
                active ? "bg-white/[0.05]" : "hover:bg-white/[0.028]"
              }`}
            >
              <div className="text-center">
                <div
                  className={`text-[0.74rem] leading-none ${
                    active ? "text-cyan-100" : "text-white/44"
                  }`}
                >
                  {tab.glyph}
                </div>
                <p
                  className={`mt-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] ${
                    active ? "text-white" : "text-white/48"
                  }`}
                >
                  {tab.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function SetupSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.2)] backdrop-blur-[22px]">
      <p className="text-[0.66rem] uppercase tracking-[0.22em] text-white/46">{title}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SegmentGrid({
  options,
  activeId,
  onChange,
  columns,
}: {
  options: ReadonlyArray<{
    id: string;
    label: string;
    caption?: string;
  }>;
  activeId: string;
  onChange: (value: string) => void;
  columns: 2 | 3;
}) {
  return (
    <div className={`grid gap-2 ${columns === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
      {options.map((option) => {
        const active = option.id === activeId;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-[1.25rem] border px-3 py-3 text-left transition ${
              active
                ? "border-cyan-200/26 bg-cyan-200/10 shadow-[0_14px_30px_rgba(90,190,255,0.12)]"
                : "border-white/10 bg-white/[0.028] hover:border-white/18 hover:bg-white/[0.05]"
            }`}
          >
            <p className={`text-[0.75rem] font-semibold ${active ? "text-white" : "text-white/82"}`}>
              {option.label}
            </p>
            {option.caption ? (
              <p className="mt-1 text-[0.62rem] leading-5 text-white/46">{option.caption}</p>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function BodyComparisonView({
  simulation,
  bodyModel,
  bodyView,
  compareProgress,
  onChangeCompareProgress,
}: {
  simulation: SimulationResult;
  bodyModel: BodyModel;
  bodyView: BodyView;
  compareProgress: number;
  onChangeCompareProgress: (value: number) => void;
}) {
  const blend = compareProgress / 100;
  const blendedMap = useMemo(
    () => blendRecord(simulation.currentMap, simulation.projectedMap, blend),
    [simulation.currentMap, simulation.projectedMap, blend],
  );
  const blendedScale = useMemo(
    () => blendRecord(simulation.currentScale, simulation.projectedScale, blend),
    [simulation.currentScale, simulation.projectedScale, blend],
  );
  const phaseLabel =
    compareProgress < 12
      ? "Current"
      : compareProgress > 88
        ? "Projected"
        : `${compareProgress}% Applied`;

  return (
    <div className="mt-5 space-y-4">
      <div className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.016))] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.58rem] uppercase tracking-[0.16em] text-white/54">
              Current
            </span>
            <span className="text-[0.62rem] uppercase tracking-[0.16em] text-white/26">to</span>
            <span className="rounded-full border border-emerald-200/16 bg-emerald-200/10 px-3 py-1 text-[0.58rem] uppercase tracking-[0.16em] text-emerald-100/78">
              Projected
            </span>
          </div>
          <span className="rounded-full border border-cyan-200/18 bg-cyan-200/10 px-3 py-1 text-[0.58rem] uppercase tracking-[0.16em] text-cyan-50/82">
            {phaseLabel}
          </span>
        </div>

        <div className="relative mt-4 flex justify-center overflow-hidden rounded-[1.6rem] border border-white/8 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.05),transparent_24%),linear-gradient(180deg,rgba(7,15,24,0.94),rgba(7,14,22,0.58))] px-2 py-3">
          <div className="pointer-events-none absolute inset-x-[16%] top-7 h-[68%] rounded-full bg-cyan-200/[0.045] blur-3xl" />
          <div className="pointer-events-none absolute inset-x-[26%] bottom-8 h-[18%] rounded-full bg-white/[0.025] blur-2xl" />
          <AnatomyDiagram
            bodyModel={bodyModel}
            bodyView={bodyView}
            mapValues={blendedMap}
            scaleValues={blendedScale}
            tone="projected"
            size="hero"
            blend={blend}
          />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-[0.62rem] uppercase tracking-[0.16em] text-white/38">
            <span>Current</span>
            <span>Projection Blend</span>
            <span>Projected</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={compareProgress}
            onChange={(event) => onChangeCompareProgress(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-200"
            aria-label="Body projection comparison"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
      <BodyStatePane
        label="Current"
        mapValues={simulation.currentMap}
        scaleValues={simulation.currentScale}
        bodyModel={bodyModel}
        bodyView={bodyView}
        tone="current"
        size="compact"
      />
      <BodyStatePane
        label="Projected"
        mapValues={simulation.projectedMap}
        scaleValues={simulation.projectedScale}
        bodyModel={bodyModel}
        bodyView={bodyView}
        tone="projected"
        size="compact"
      />
      </div>
    </div>
  );
}

function BodyStatePane({
  label,
  mapValues,
  scaleValues,
  bodyModel,
  bodyView,
  tone,
  size,
}: {
  label: string;
  mapValues: Record<MuscleKey, number>;
  scaleValues: Record<MuscleKey, number>;
  bodyModel: BodyModel;
  bodyView: BodyView;
  tone: "current" | "projected";
  size: "compact" | "hero";
}) {
  return (
    <div className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-3 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/48">{label}</p>
        {tone === "projected" ? (
          <span className="rounded-full border border-emerald-200/18 bg-emerald-200/10 px-2.5 py-1 text-[0.56rem] uppercase tracking-[0.14em] text-emerald-100/82">
            target
          </span>
        ) : null}
      </div>

      <div className="mt-3 flex justify-center">
        <AnatomyDiagram
          bodyModel={bodyModel}
          bodyView={bodyView}
          mapValues={mapValues}
          scaleValues={scaleValues}
          tone={tone}
          size={size}
          blend={tone === "projected" ? 1 : 0}
        />
      </div>
    </div>
  );
}

function SimulationSummaryStrip({ simulation }: { simulation: SimulationResult }) {
  return (
    <section className="grid grid-cols-3 gap-2">
      <SummaryMetric
        label="Weight"
        current={simulation.current.weight}
        projected={simulation.projected.weight}
        unit="lb"
      />
      <SummaryMetric
        label="Body Fat"
        current={simulation.current.bodyFat}
        projected={simulation.projected.bodyFat}
        unit="%"
        positiveIsGood={false}
      />
      <SummaryMetric
        label="Lean Mass"
        current={simulation.current.leanMass}
        projected={simulation.projected.leanMass}
        unit="lb"
      />
    </section>
  );
}

function SummaryMetric({
  label,
  current,
  projected,
  unit,
  positiveIsGood = true,
}: {
  label: string;
  current: number;
  projected: number;
  unit: string;
  positiveIsGood?: boolean;
}) {
  const delta = projected - current;
  const good = positiveIsGood ? delta >= 0 : delta <= 0;

  return (
    <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-3 py-3 backdrop-blur-[18px]">
      <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/42">{label}</p>
      <p className="mt-2 text-[0.9rem] font-semibold text-white">
        {formatValue(current, unit)} <span className="text-white/32">→</span> {formatValue(projected, unit)}
      </p>
      <p className={`mt-1 text-[0.72rem] ${good ? "text-emerald-200" : "text-amber-200"}`}>
        {delta >= 0 ? "+" : ""}
        {formatDelta(delta, unit)}
      </p>
    </div>
  );
}

function CompactMetricTable({ simulation }: { simulation: SimulationResult }) {
  return (
    <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/18">
      <div className="grid grid-cols-[1.2fr_0.88fr_0.88fr_0.72fr] gap-3 border-b border-white/10 px-4 py-3 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/42">
        <span>Metric</span>
        <span className="text-right">Current</span>
        <span className="text-right">Projected</span>
        <span className="text-right">Delta</span>
      </div>

      {coreMetricRows.map((row) => (
        <CompactMetricRow key={row.key} simulation={simulation} metricKey={row.key} label={row.label} unit={row.unit} positiveIsGood={row.positiveIsGood} />
      ))}
    </div>
  );
}

function CompactMetricRow({
  simulation,
  label,
  metricKey,
  unit,
  positiveIsGood,
}: {
  simulation: SimulationResult;
  label: string;
  metricKey: keyof BodyMetrics;
  unit: string;
  positiveIsGood: boolean;
}) {
  const current = simulation.current[metricKey];
  const projected = simulation.projected[metricKey];
  const delta = projected - current;
  const good = positiveIsGood ? delta >= 0 : delta <= 0;

  return (
    <div className="grid grid-cols-[1.2fr_0.88fr_0.88fr_0.72fr] gap-3 border-b border-white/6 px-4 py-3 text-[0.76rem] text-white/82 last:border-b-0">
      <span className="text-white/74">{label}</span>
      <span className="text-right">{formatValue(current, unit)}</span>
      <span className="text-right font-medium text-white">{formatValue(projected, unit)}</span>
      <span className={`text-right font-medium ${good ? "text-emerald-200" : "text-amber-200"}`}>
        {delta >= 0 ? "+" : ""}
        {formatDelta(delta, unit)}
      </span>
    </div>
  );
}

function StrengthDeltaRow({ metric }: { metric: StrengthMetricResult }) {
  const delta = metric.projected - metric.current;
  const good = delta >= 0;

  return (
    <div className="grid grid-cols-[1.1fr_0.75fr_0.7fr] items-center gap-3 rounded-[1.2rem] border border-white/10 bg-black/18 px-3 py-3">
      <div>
        <p className="text-[0.76rem] font-semibold text-white">{metric.label}</p>
        <p className="mt-1 text-[0.64rem] text-white/42">
          {formatStrengthValue(metric.current, metric.unit)} {"->"}{" "}
          {formatStrengthValue(metric.projected, metric.unit)}
        </p>
      </div>
      <p className="text-right text-[0.74rem] text-white/54">Projected</p>
      <p className={`text-right text-[0.82rem] font-semibold ${good ? "text-emerald-200" : "text-amber-200"}`}>
        {delta >= 0 ? "+" : ""}
        {metric.unit === "lb" ? `${roundTo(delta, 0).toFixed(0)} lb` : `${delta.toFixed(1)} reps`}
      </p>
    </div>
  );
}

function CompactTrendChart({
  label,
  accent,
  points,
  values,
}: {
  label: string;
  accent: string;
  points: TimelinePoint[];
  values: number[];
}) {
  const width = 310;
  const height = 82;
  const path = buildLinePath(values, width, height, 10);
  const areaPath = buildAreaPath(values, width, height, 10);

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/18 px-3 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.72rem] font-semibold text-white">{label}</p>
        <p className="text-[0.6rem] uppercase tracking-[0.16em] text-white/34">
          {points[points.length - 1]?.label}
        </p>
      </div>

      <div className="mt-3 overflow-hidden rounded-[1rem] bg-[#071018]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-[5.1rem] w-full">
          <path d={areaPath} fill={hexToRgba(accent, 0.14)} />
          <path
            d={path}
            fill="none"
            stroke={accent}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function InsightCard({
  insight,
}: {
  insight: {
    title: string;
    body: string;
  };
}) {
  return (
    <section className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] px-4 py-4 shadow-[0_18px_42px_rgba(0,0,0,0.2)] backdrop-blur-[22px]">
      <p className="text-[0.66rem] uppercase tracking-[0.22em] text-white/46">{insight.title}</p>
      <p className="mt-2 text-[0.82rem] leading-6 text-white/78">{insight.body}</p>
    </section>
  );
}

function FactorChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-[20px]">
      <p className="text-[0.62rem] uppercase tracking-[0.18em] text-white/42">{label}</p>
      <p className={`mt-2 text-[1.05rem] font-semibold ${accent}`}>{Math.round(value * 100)}%</p>
    </div>
  );
}

function AnatomyDiagram({
  bodyModel,
  bodyView,
  mapValues,
  scaleValues,
  tone,
  size,
  blend = tone === "projected" ? 1 : 0,
}: {
  bodyModel: BodyModel;
  bodyView: BodyView;
  mapValues: Record<MuscleKey, number>;
  scaleValues: Record<MuscleKey, number>;
  tone: "current" | "projected";
  size: "compact" | "hero";
  blend?: number;
}) {
  const silhouetteColor =
    tone === "projected"
      ? `rgba(79,255,214,${0.18 + blend * 0.16})`
      : "rgba(149,162,175,0.16)";
  const outlineColor =
    tone === "projected"
      ? `rgba(222,255,247,${0.24 + blend * 0.26})`
      : "rgba(255,255,255,0.18)";
  const glowColor =
    tone === "projected"
      ? `rgba(92,255,219,${0.1 + blend * 0.22})`
      : "rgba(255,255,255,0.08)";
  const headScale = bodyModel === "female" ? 0.98 : 1;
  const lowerBodyScale = bodyModel === "female" ? 1.05 : 0.99;
  const upperBodyScale = bodyModel === "female" ? 0.96 : 1.05;
  const diagramClass =
    size === "hero" ? "h-[27.5rem] w-full max-w-[14.5rem]" : "h-[19rem] w-full max-w-[9.8rem]";
  const glowStdDev =
    tone === "projected" ? (size === "hero" ? 11 : 8) : size === "hero" ? 5 : 4;
  const shell = anatomyShellPaths[bodyView];
  const detailOpacity =
    tone === "projected" ? 0.12 + blend * 0.14 : size === "hero" ? 0.08 : 0.1;
  const detailStroke =
    tone === "projected"
      ? `rgba(227,255,249,${detailOpacity.toFixed(3)})`
      : `rgba(255,255,255,${detailOpacity.toFixed(3)})`;
  const shellStrokeWidth = size === "hero" ? 1.02 : 1.15;
  const regionStrokeWidth = size === "hero" ? 0.82 : 1;

  return (
    <svg viewBox="0 0 180 360" className={diagramClass}>
      <defs>
        <linearGradient id={`bodyBase-${tone}`} x1="0" x2="1">
          <stop offset="0%" stopColor={silhouetteColor} />
          <stop offset="100%" stopColor="rgba(255,255,255,0.045)" />
        </linearGradient>
        <filter id={`glow-${tone}`}>
          <feGaussianBlur stdDeviation={String(glowStdDev)} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#glow-${tone})`}>
        <path
          d={shell.head}
          fill={`url(#bodyBase-${tone})`}
          stroke={outlineColor}
          strokeWidth={shellStrokeWidth}
          transform={`translate(0 ${-(1 - headScale) * 10}) scale(${headScale} ${headScale}) translate(${90 - 90 * headScale} ${34 - 34 * headScale})`}
        />
        <path
          d={shell.neck}
          fill={`url(#bodyBase-${tone})`}
          stroke={outlineColor}
          strokeWidth={shellStrokeWidth}
        />
        <path
          d={shell.body}
          fill={`url(#bodyBase-${tone})`}
          stroke={outlineColor}
          strokeWidth={shellStrokeWidth}
        />
      </g>

      {anatomyRegions[bodyView].map((region) => {
        const score = clamp(mapValues[region.key], 0.12, 1);
        const scaleBase =
          region.key === "shoulders" ||
          region.key === "chest" ||
          region.key === "upperBack" ||
          region.key === "lats"
            ? upperBodyScale
            : region.key === "glutes" ||
                region.key === "thighs" ||
                region.key === "hamstrings"
              ? lowerBodyScale
              : 1;
        const scale = scaleBase * scaleValues[region.key];
        const fillColor =
          tone === "projected"
            ? `rgba(112,255,224,${(0.12 + blend * 0.14 + score * 0.42).toFixed(3)})`
            : `rgba(148,167,184,${(0.08 + score * 0.18).toFixed(3)})`;
        const strokeColor =
          tone === "projected"
            ? `rgba(231,255,248,${(0.08 + blend * 0.12 + score * 0.18).toFixed(3)})`
            : "rgba(255,255,255,0.07)";
        const transform = `translate(${region.anchor.x} ${region.anchor.y}) scale(${scale}) translate(${-region.anchor.x} ${-region.anchor.y})`;

        return (
          <g key={`${bodyView}-${region.key}`} transform={transform}>
            {region.shapes.map((shape, index) => (
              <AnatomyShape
                key={`${region.key}-${index}`}
                shape={shape}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={regionStrokeWidth}
              />
            ))}
          </g>
        );
      })}

      <g
        stroke={detailStroke}
        strokeWidth={size === "hero" ? "0.82" : "1.05"}
        strokeLinecap="round"
        fill="none"
      >
        {anatomyDetailPaths[bodyView].map((path) => (
          <path key={path} d={path} />
        ))}
      </g>

      <ellipse
        cx="90"
        cy="196"
        rx={tone === "projected" ? 50 + blend * 8 : 46}
        ry={tone === "projected" ? 120 + blend * 16 : 118}
        fill={glowColor}
        opacity={tone === "projected" ? 0.35 + blend * 0.45 : 0.35}
      />
    </svg>
  );
}

function AnatomyShape({
  shape,
  fill,
  stroke,
  strokeWidth = 1,
}: {
  shape:
    | {
        type: "ellipse";
        cx: number;
        cy: number;
        rx: number;
        ry: number;
        rotate?: number;
      }
    | {
        type: "rect";
        x: number;
        y: number;
        width: number;
        height: number;
        rx: number;
        rotate?: number;
      }
    | {
        type: "path";
        d: string;
      };
  fill: string;
  stroke: string;
  strokeWidth?: number;
}) {
  if (shape.type === "ellipse") {
    return (
      <ellipse
        cx={shape.cx}
        cy={shape.cy}
        rx={shape.rx}
        ry={shape.ry}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        transform={shape.rotate ? `rotate(${shape.rotate} ${shape.cx} ${shape.cy})` : undefined}
      />
    );
  }

  if (shape.type === "rect") {
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;

    return (
      <rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        rx={shape.rx}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        transform={shape.rotate ? `rotate(${shape.rotate} ${centerX} ${centerY})` : undefined}
      />
    );
  }

  return <path d={shape.d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
}

function simulatePhysique(args: SimulationConfig): SimulationResult {
  const base = baseStateByModel[args.bodyModel];
  const baseLeanMass = base.weight * (1 - base.bodyFat / 100);
  const baseFatMass = base.weight - baseLeanMass;
  const focus = focusProfiles[args.trainingFocus];
  const split = splitProfiles[args.workoutSplit];
  const calories = calorieProfiles[args.calorieTarget];
  const protein = proteinProfiles[args.proteinLevel];
  const consistency = consistencyProfiles[args.consistency];
  const timeframe = timeframeProfiles[args.timeframe];
  const months = timeframe.weeks / 4.345;

  const volume = clamp(focus.volume * 0.44 + split.volume * 0.56, 0.3, 0.96);
  const intensity = clamp(focus.intensity * 0.42 + split.intensity * 0.58, 0.32, 0.96);
  const frequency = clamp(focus.frequency * 0.36 + split.frequency * 0.64, 0.32, 0.96);
  const focusAverage =
    Object.values(focus.emphasis).reduce((sum, value) => sum + value, 0) / 10;
  const fatigueIndex = clamp(
    volume * 0.34 +
      intensity * 0.24 +
      frequency * 0.18 +
      split.fatigue * 0.24 -
      consistency.fatigueBuffer * 0.1 -
      protein.recovery * 0.04 -
      calories.recoveryBoost * 0.05,
    0.18,
    0.82,
  );
  const recoveryScore = clamp(
    0.58 +
      consistency.recovery * 0.15 +
      protein.recovery * 0.16 +
      calories.recoveryBoost * 0.14 -
      fatigueIndex * 0.28,
    0.55,
    1.05,
  );
  const stimulusScore = clamp(
    volume * 0.34 + intensity * 0.22 + frequency * 0.18 + focusAverage * 0.26,
    0.42,
    1.04,
  );

  const leanPotentialPerMonth = args.bodyModel === "male" ? 0.92 : 0.64;
  let leanGain =
    leanPotentialPerMonth *
    months *
    stimulusScore *
    protein.anabolic *
    consistency.factor *
    recoveryScore *
    calories.muscleSupport;

  if (args.calorieTarget === "maintain" && args.proteinLevel !== "baseline") {
    leanGain += (args.bodyModel === "male" ? 0.18 : 0.12) * months * consistency.factor;
  }

  leanGain *= clamp(1 - fatigueIndex * 0.12, 0.82, 1);
  leanGain = clamp(
    leanGain,
    args.bodyModel === "male" ? -0.6 : -0.4,
    args.bodyModel === "male" ? 5.6 : 4.1,
  );

  let fatChange =
    timeframe.weeks *
    calories.weeklyFatChange *
    (0.86 + consistency.factor * 0.24) *
    (1 + (args.calorieTarget === "cut" ? protein.recovery * 0.08 : 0));

  if (args.calorieTarget === "maintain") {
    fatChange -=
      timeframe.weeks *
      0.04 *
      (protein.anabolic - 0.84) *
      Math.max(0, consistency.factor - 0.65) *
      recoveryScore;
  }

  fatChange = clamp(
    fatChange,
    args.bodyModel === "male" ? -9.5 : -8.2,
    args.calorieTarget === "lean_gain" ? 4.5 : 1.2,
  );

  const projectedFatMass = clamp(baseFatMass + fatChange, base.minFatMass, base.maxFatMass);
  const projectedLeanMass = clamp(
    baseLeanMass + leanGain,
    baseLeanMass - 1.2,
    baseLeanMass + (args.bodyModel === "male" ? 6.2 : 4.6),
  );
  const projectedWeight = projectedLeanMass + projectedFatMass;
  const projectedBodyFat = (projectedFatMass / projectedWeight) * 100;
  const definitionSignal = clamp((base.bodyFat - projectedBodyFat) / 8, -0.2, 1);
  const leanSignal = clamp(leanGain / (args.bodyModel === "male" ? 5.5 : 4.1), -0.2, 1);
  const surplusSignal = clamp(fatChange / 4.5, -1, 1);

  const projectedMetrics: BodyMetrics = {
    weight: roundTo(projectedWeight, 1),
    bodyFat: roundTo(projectedBodyFat, 1),
    leanMass: roundTo(projectedLeanMass, 1),
    shoulders: roundTo(
      base.shoulders +
        leanGain * (0.16 + focus.emphasis.shoulders * 0.11) +
        Math.max(definitionSignal, 0) * 0.12,
      1,
    ),
    chest: roundTo(
      base.chest + leanGain * (0.13 + focus.emphasis.chest * 0.12) + Math.max(surplusSignal, 0) * 0.12,
      1,
    ),
    arms: roundTo(base.arms + leanGain * (0.1 + focus.emphasis.arms * 0.08), 1),
    waist: roundTo(
      base.waist + fatChange * 0.23 - leanGain * 0.02 - Math.max(definitionSignal, 0) * 0.14,
      1,
    ),
    thighs: roundTo(
      base.thighs +
        leanGain * (0.12 + focus.emphasis.thighs * 0.13 + focus.emphasis.glutes * 0.04) +
        Math.max(surplusSignal, 0) * 0.35,
      1,
    ),
  };

  const currentMetrics: BodyMetrics = {
    weight: roundTo(base.weight, 1),
    bodyFat: roundTo(base.bodyFat, 1),
    leanMass: roundTo(baseLeanMass, 1),
    shoulders: base.shoulders,
    chest: base.chest,
    arms: base.arms,
    waist: base.waist,
    thighs: base.thighs,
  };

  const currentMap = { ...baseBodyMap[args.bodyModel] };
  const projectedMap = { ...baseBodyMap[args.bodyModel] };
  const currentScale = createDefaultScaleMap(args.bodyModel);
  const projectedScale = createDefaultScaleMap(args.bodyModel);

  (Object.keys(projectedMap) as MuscleKey[]).forEach((key) => {
    const emphasis = focus.emphasis[key];
    const definitionBoost = key === "core" ? Math.max(definitionSignal, 0) * 0.26 : 0;
    const surplusBoost =
      key === "core" ? Math.max(surplusSignal, 0) * 0.02 : Math.max(surplusSignal, 0) * 0.06;

    projectedMap[key] = clamp(
      currentMap[key] + emphasis * 0.5 * leanSignal + definitionBoost + surplusBoost,
      0.12,
      1,
    );

    if (key === "core") {
      projectedScale[key] = clamp(
        currentScale[key] + fatChange * 0.005 - Math.max(definitionSignal, 0) * 0.08,
        0.8,
        1.08,
      );
      return;
    }

    projectedScale[key] = clamp(
      currentScale[key] +
        emphasis * 0.17 * leanSignal +
        Math.max(surplusSignal, 0) * 0.038 +
        (key === "shoulders" || key === "lats" || key === "glutes" || key === "thighs"
          ? 0.016 * leanSignal
          : 0),
      0.92,
      1.38,
    );
  });

  const topChanges = (Object.keys(projectedMap) as MuscleKey[])
    .map((key) => ({
      label: muscleLabels[key],
      deltaPercent: Math.max(0, Math.round((projectedMap[key] - currentMap[key]) * 100)),
    }))
    .sort((left, right) => right.deltaPercent - left.deltaPercent)
    .slice(0, 3);

  const strengthMetrics = focus.metricKeys.map((key) => {
    const metric = strengthMetricsCatalog[key];
    const current = metric.baseline[args.bodyModel];
    const stimulusMatch = Object.entries(metric.muscles).reduce((sum, [muscleKey, weight]) => {
      return sum + focus.emphasis[muscleKey as MuscleKey] * (weight ?? 0);
    }, 0);
    const strengthFactor = clamp(
      (0.024 + timeframe.weeks * 0.0034) *
        intensity *
        consistency.factor *
        recoveryScore *
        calories.strengthSupport *
        (0.72 + stimulusMatch * 0.52),
      0.02,
      0.18,
    );

    if (metric.unit === "reps") {
      const projected = clamp(
        current +
          timeframe.weeks *
            0.18 *
            consistency.factor *
            recoveryScore *
            calories.strengthSupport *
            (0.7 + stimulusMatch * 0.45),
        current - 1,
        current + 8,
      );

      return {
        key,
        label: metric.label,
        unit: metric.unit,
        current,
        projected: roundTo(projected, 1),
      };
    }

    return {
      key,
      label: metric.label,
      unit: metric.unit,
      current,
      projected: roundToNearest(current * (1 + strengthFactor), 5),
    };
  });

  const timeline = buildTimeline({
    weeks: timeframe.weeks,
    current: currentMetrics,
    leanGain,
    fatChange,
    fatigueIndex,
  });

  const primaryChange = topChanges[0]?.label ?? "Upper body";
  const secondaryChange = topChanges[1]?.label ?? "Midline";
  const nutritionEffect =
    args.calorieTarget === "cut"
      ? "A deficit sharpens the waist fastest, but slows visible mass gain."
      : args.calorieTarget === "maintain"
        ? "Maintenance keeps the projection tighter and more recomposition-driven."
        : "A small surplus improves size gain, with a modest softness tradeoff.";
  const fatigueEffect =
    fatigueIndex > 0.62
      ? "Fatigue rises late, so progress begins flattening before the end of the block."
      : fatigueIndex > 0.46
        ? "Recovery remains workable, but later weeks smooth out rather than accelerating."
        : "Recovery stays controlled, so the projection holds its pace through the block.";

  const insights = [
    {
      title: "Primary Response",
      body: `${primaryChange} and ${secondaryChange} respond most strongly to this setup over ${timeframe.label}.`,
    },
    {
      title: "Nutrition Effect",
      body: nutritionEffect,
    },
    {
      title: "Recovery Constraint",
      body: fatigueEffect,
    },
  ];

  return {
    current: currentMetrics,
    projected: projectedMetrics,
    strengthMetrics,
    currentMap,
    projectedMap,
    currentScale,
    projectedScale,
    modelFactors: {
      volume,
      intensity,
      frequency,
      recovery: recoveryScore,
      fatigue: fatigueIndex,
    },
    insights,
    topChanges,
    timeline,
    timeframeLabel: timeframe.label,
  };
}

function buildTimeline(args: {
  weeks: number;
  current: BodyMetrics;
  leanGain: number;
  fatChange: number;
  fatigueIndex: number;
}) {
  const totalPoints = 7;
  const currentFatMass = args.current.weight - args.current.leanMass;

  return Array.from({ length: totalPoints }, (_, index) => {
    const week = roundTo((args.weeks / (totalPoints - 1)) * index, 0);
    const leanCurve = 1 - Math.exp(-week / (args.weeks * 0.34 + 2.2));
    const fatCurve = 1 - Math.exp(-week / (args.weeks * 0.28 + 1.8));
    const fatigueWave =
      1 - args.fatigueIndex * 0.06 * Math.sin((index / (totalPoints - 1)) * Math.PI);
    const leanMass = args.current.leanMass + args.leanGain * leanCurve * fatigueWave;
    const fatMass = currentFatMass + args.fatChange * fatCurve;
    const weight = leanMass + fatMass;
    const bodyFat = (fatMass / weight) * 100;

    return {
      label: week === 0 ? "Now" : `W${week}`,
      week,
      weight: roundTo(weight, 1),
      bodyFat: roundTo(bodyFat, 1),
      leanMass: roundTo(leanMass, 1),
    };
  });
}

function createDefaultScaleMap(bodyModel: BodyModel): Record<MuscleKey, number> {
  const upperBias = bodyModel === "male" ? 1.02 : 0.98;
  const lowerBias = bodyModel === "female" ? 1.03 : 0.99;

  return {
    shoulders: upperBias,
    chest: upperBias,
    arms: 1,
    core: bodyModel === "female" ? 0.98 : 1,
    thighs: lowerBias,
    calves: 1,
    upperBack: upperBias,
    lats: upperBias,
    glutes: lowerBias,
    hamstrings: lowerBias,
  };
}

function buildLinePath(values: number[], width: number, height: number, padding: number) {
  if (!values.length) {
    return "";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 0.1);
  const stepX = (width - padding * 2) / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = padding + stepX * index;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(values: number[], width: number, height: number, padding: number) {
  if (!values.length) {
    return "";
  }

  const linePath = buildLinePath(values, width, height, padding);
  const stepX = (width - padding * 2) / Math.max(values.length - 1, 1);
  const lastX = padding + stepX * (values.length - 1);

  return `${linePath} L${lastX.toFixed(2)} ${(height - padding).toFixed(2)} L${padding.toFixed(2)} ${(height - padding).toFixed(2)} Z`;
}

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((char) => char + char)
          .join("")
      : clean;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${alpha})`;
}

function formatValue(value: number, unit: string) {
  return `${value.toFixed(1)}${unit}`;
}

function formatDelta(value: number, unit: string) {
  return `${Math.abs(value).toFixed(1)}${unit}`;
}

function formatStrengthValue(value: number, unit: "lb" | "reps") {
  if (unit === "reps") {
    return `${value.toFixed(1)} reps`;
  }

  return `${value.toFixed(0)} lb`;
}

function roundTo(value: number, decimals: number) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function roundToNearest(value: number, nearest: number) {
  return Math.round(value / nearest) * nearest;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function blendRecord<T extends string>(
  current: Record<T, number>,
  projected: Record<T, number>,
  blend: number,
) {
  return Object.fromEntries(
    Object.keys(current).map((key) => [
      key,
      current[key as T] + (projected[key as T] - current[key as T]) * blend,
    ]),
  ) as Record<T, number>;
}
