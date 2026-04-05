"use client";

import { useState } from "react";

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

const bodyModelOptions = [
  { id: "male", label: "Male", caption: "Broad-shouldered baseline profile." },
  { id: "female", label: "Female", caption: "Lower-body weighted baseline profile." },
] as const;

const trainingFocusOptions = [
  {
    id: "balanced",
    label: "Balanced Physique",
    caption: "Even muscular development with steady recomposition.",
  },
  {
    id: "v_taper",
    label: "V-Taper",
    caption: "Bias delts, upper back, and lat width.",
  },
  {
    id: "upper_push",
    label: "Chest + Arms",
    caption: "Push-dominant upper-body emphasis.",
  },
  {
    id: "lower_body",
    label: "Lower Body",
    caption: "Glutes, quads, hamstrings, and lower-body density.",
  },
  {
    id: "recomp_strength",
    label: "Strength Recomp",
    caption: "Technical compounds with slower, leaner adaptation.",
  },
] as const;

const workoutSplitOptions = [
  {
    id: "full_body",
    label: "Full Body 3x",
    caption: "Lower fatigue, strong weekly frequency.",
  },
  {
    id: "upper_lower",
    label: "Upper / Lower 4x",
    caption: "Balanced volume and recoverability.",
  },
  {
    id: "ppl",
    label: "Push Pull Legs 5x",
    caption: "Higher specialization and total volume.",
  },
  {
    id: "specialization",
    label: "Specialization 5x",
    caption: "Highest focus with the biggest fatigue cost.",
  },
] as const;

const calorieOptions = [
  {
    id: "cut",
    label: "Cut",
    caption: "Deficit-first, slower muscle gain, faster waist change.",
  },
  {
    id: "maintain",
    label: "Maintain",
    caption: "Body recomposition with moderate scale change.",
  },
  {
    id: "lean_gain",
    label: "Lean Gain",
    caption: "Small surplus with higher lean-mass potential.",
  },
] as const;

const proteinOptions = [
  {
    id: "baseline",
    label: "0.7 g/lb",
    caption: "Adequate, but not maximized for retention.",
  },
  {
    id: "target",
    label: "0.9 g/lb",
    caption: "Strong baseline for growth and recovery.",
  },
  {
    id: "high",
    label: "1.0+ g/lb",
    caption: "Optimized for recovery and lean mass retention.",
  },
] as const;

const consistencyOptions = [
  {
    id: "steady",
    label: "72%",
    caption: "Missed sessions and less stable recovery.",
  },
  {
    id: "high",
    label: "84%",
    caption: "Solid weekly adherence and decent recovery.",
  },
  {
    id: "locked",
    label: "94%",
    caption: "Tight execution, sleep, and meal consistency.",
  },
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

const muscleLabels: Record<MuscleKey, string> = {
  shoulders: "Shoulders",
  chest: "Chest",
  arms: "Arms",
  core: "Waist / Core",
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
    label: "moderate adherence",
  },
  high: {
    factor: 0.84,
    recovery: 0.9,
    fatigueBuffer: 0.82,
    label: "high adherence",
  },
  locked: {
    factor: 0.94,
    recovery: 0.98,
    fatigueBuffer: 0.94,
    label: "elite adherence",
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
    label: "Bench Press",
    unit: "lb",
    baseline: { male: 185, female: 95 },
    muscles: { chest: 0.58, shoulders: 0.22, arms: 0.2 },
  },
  incline_press: {
    label: "Incline Press",
    unit: "lb",
    baseline: { male: 155, female: 80 },
    muscles: { chest: 0.42, shoulders: 0.38, arms: 0.2 },
  },
  overhead_press: {
    label: "Overhead Press",
    unit: "lb",
    baseline: { male: 115, female: 65 },
    muscles: { shoulders: 0.65, arms: 0.2, core: 0.15 },
  },
  barbell_row: {
    label: "Barbell Row",
    unit: "lb",
    baseline: { male: 165, female: 95 },
    muscles: { upperBack: 0.34, lats: 0.4, arms: 0.18, core: 0.08 },
  },
  pull_ups: {
    label: "Strict Pull-Ups",
    unit: "reps",
    baseline: { male: 8, female: 3 },
    muscles: { lats: 0.5, upperBack: 0.25, arms: 0.2, core: 0.05 },
  },
  high_bar_squat: {
    label: "High-Bar Squat",
    unit: "lb",
    baseline: { male: 255, female: 165 },
    muscles: { thighs: 0.46, glutes: 0.28, core: 0.14, calves: 0.12 },
  },
  romanian_deadlift: {
    label: "Romanian Deadlift",
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
      anchor: { x: 90, y: 90 },
      shapes: [
        { type: "ellipse", cx: 54, cy: 88, rx: 22, ry: 14, rotate: -20 },
        { type: "ellipse", cx: 126, cy: 88, rx: 22, ry: 14, rotate: 20 },
      ],
    },
    {
      key: "chest",
      anchor: { x: 90, y: 118 },
      shapes: [
        { type: "ellipse", cx: 72, cy: 118, rx: 20, ry: 25, rotate: 12 },
        { type: "ellipse", cx: 108, cy: 118, rx: 20, ry: 25, rotate: -12 },
      ],
    },
    {
      key: "arms",
      anchor: { x: 90, y: 150 },
      shapes: [
        { type: "rect", x: 28, y: 104, width: 16, height: 88, rx: 8, rotate: 7 },
        { type: "rect", x: 136, y: 104, width: 16, height: 88, rx: 8, rotate: -7 },
      ],
    },
    {
      key: "core",
      anchor: { x: 90, y: 162 },
      shapes: [
        {
          type: "path",
          d: "M68 130 C76 118 104 118 112 130 L106 202 C102 210 78 210 74 202 Z",
        },
      ],
    },
    {
      key: "thighs",
      anchor: { x: 90, y: 242 },
      shapes: [
        {
          type: "path",
          d: "M72 206 C82 204 86 214 86 232 L82 294 C80 302 68 302 64 292 L60 232 C60 216 64 208 72 206 Z",
        },
        {
          type: "path",
          d: "M108 206 C116 208 120 216 120 232 L116 292 C112 302 100 302 98 294 L94 232 C94 214 98 204 108 206 Z",
        },
      ],
    },
    {
      key: "calves",
      anchor: { x: 90, y: 313 },
      shapes: [
        {
          type: "path",
          d: "M66 294 C74 292 78 300 78 314 L76 344 C74 350 66 350 62 344 L60 314 C60 302 62 296 66 294 Z",
        },
        {
          type: "path",
          d: "M114 294 C118 296 120 302 120 314 L118 344 C114 350 106 350 104 344 L102 314 C102 300 106 292 114 294 Z",
        },
      ],
    },
  ],
  back: [
    {
      key: "shoulders",
      anchor: { x: 90, y: 88 },
      shapes: [
        { type: "ellipse", cx: 56, cy: 86, rx: 21, ry: 14, rotate: -18 },
        { type: "ellipse", cx: 124, cy: 86, rx: 21, ry: 14, rotate: 18 },
      ],
    },
    {
      key: "upperBack",
      anchor: { x: 90, y: 112 },
      shapes: [
        {
          type: "path",
          d: "M66 88 C74 82 106 82 114 88 L120 146 C112 154 68 154 60 146 Z",
        },
      ],
    },
    {
      key: "lats",
      anchor: { x: 90, y: 142 },
      shapes: [
        {
          type: "path",
          d: "M62 116 C70 110 80 112 86 126 L82 194 C72 198 60 190 56 176 L54 142 C54 130 56 120 62 116 Z",
        },
        {
          type: "path",
          d: "M118 116 C124 120 126 130 126 142 L124 176 C120 190 108 198 98 194 L94 126 C100 112 110 110 118 116 Z",
        },
      ],
    },
    {
      key: "arms",
      anchor: { x: 90, y: 150 },
      shapes: [
        { type: "rect", x: 26, y: 106, width: 16, height: 88, rx: 8, rotate: 7 },
        { type: "rect", x: 138, y: 106, width: 16, height: 88, rx: 8, rotate: -7 },
      ],
    },
    {
      key: "glutes",
      anchor: { x: 90, y: 214 },
      shapes: [
        { type: "ellipse", cx: 76, cy: 216, rx: 18, ry: 16, rotate: 0 },
        { type: "ellipse", cx: 104, cy: 216, rx: 18, ry: 16, rotate: 0 },
      ],
    },
    {
      key: "hamstrings",
      anchor: { x: 90, y: 252 },
      shapes: [
        {
          type: "path",
          d: "M72 226 C80 224 84 232 84 248 L82 302 C78 308 68 308 64 300 L60 248 C60 236 64 228 72 226 Z",
        },
        {
          type: "path",
          d: "M108 226 C116 228 120 236 120 248 L116 300 C112 308 102 308 98 302 L96 248 C96 232 100 224 108 226 Z",
        },
      ],
    },
    {
      key: "calves",
      anchor: { x: 90, y: 314 },
      shapes: [
        {
          type: "path",
          d: "M66 300 C72 298 76 304 76 316 L74 344 C72 350 64 350 60 344 L58 316 C58 306 60 302 66 300 Z",
        },
        {
          type: "path",
          d: "M114 300 C118 302 120 306 120 316 L118 344 C114 350 106 350 104 344 L102 316 C102 304 108 298 114 300 Z",
        },
      ],
    },
  ],
} as const;

export function FitnessSimulatorApp() {
  const [bodyModel, setBodyModel] = useState<BodyModel>("male");
  const [trainingFocus, setTrainingFocus] = useState<TrainingFocus>("balanced");
  const [workoutSplit, setWorkoutSplit] = useState<WorkoutSplit>("upper_lower");
  const [calorieTarget, setCalorieTarget] = useState<CalorieTarget>("maintain");
  const [proteinLevel, setProteinLevel] = useState<ProteinLevel>("target");
  const [consistency, setConsistency] = useState<ConsistencyLevel>("high");
  const [timeframe, setTimeframe] = useState<TimeframeId>("12w");
  const [bodyView, setBodyView] = useState<BodyView>("front");

  const simulation = simulatePhysique({
    bodyModel,
    trainingFocus,
    workoutSplit,
    calorieTarget,
    proteinLevel,
    consistency,
    timeframe,
  });

  return (
    <div
      className="relative h-full overflow-y-auto text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left,rgba(105,240,216,0.22),transparent 22%), radial-gradient(circle at 82% 10%,rgba(156,255,198,0.16),transparent 18%), linear-gradient(180deg,#05080b 0%,#081319 48%,#0d1c22 100%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:22px_22px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_36%)]" />

      <div className="relative z-10 space-y-4 px-4 pb-7 pt-5">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-[26px]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-white/58">
                Performance Lab
              </p>
              <h1 className="mt-2 text-[1.85rem] font-semibold tracking-[-0.06em] text-white">
                Physique Adaptation Simulator
              </h1>
            </div>
            <span className="rounded-full border border-emerald-300/24 bg-emerald-300/10 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-emerald-100/82">
              Simulation Only
            </span>
          </div>

          <p className="mt-3 max-w-[26rem] text-[0.82rem] leading-6 text-white/72">
            A premium projection tool that estimates body-composition, muscle-emphasis, and
            strength adaptation from training, nutrition, recovery, and adherence inputs. All
            outputs are simulated estimates, not medical truth.
          </p>
        </section>

        <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_22px_54px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
          <SectionLabel title="Baseline" caption="Choose the model and projection horizon." />
          <OptionGrid
            columns={2}
            options={bodyModelOptions}
            activeId={bodyModel}
            onChange={(value) => setBodyModel(value as BodyModel)}
          />
          <OptionGrid
            columns={3}
            options={timeframeOptions.map((option) => ({
              id: option.id,
              label: option.label,
              caption: `${option.weeks} weeks`,
            }))}
            activeId={timeframe}
            onChange={(value) => setTimeframe(value as TimeframeId)}
          />
        </section>

        <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_22px_54px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
          <SectionLabel
            title="Training Inputs"
            caption="Training focus drives regional emphasis; split shapes volume, intensity, and weekly frequency."
          />
          <OptionGrid
            columns={2}
            options={trainingFocusOptions}
            activeId={trainingFocus}
            onChange={(value) => setTrainingFocus(value as TrainingFocus)}
          />
          <OptionGrid
            columns={2}
            options={workoutSplitOptions}
            activeId={workoutSplit}
            onChange={(value) => setWorkoutSplit(value as WorkoutSplit)}
          />
        </section>

        <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_22px_54px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
          <SectionLabel
            title="Fueling + Adherence"
            caption="Calorie balance, protein, and consistency shape recomposition, recovery, and fatigue tolerance."
          />
          <OptionGrid
            columns={3}
            options={calorieOptions}
            activeId={calorieTarget}
            onChange={(value) => setCalorieTarget(value as CalorieTarget)}
          />
          <OptionGrid
            columns={3}
            options={proteinOptions}
            activeId={proteinLevel}
            onChange={(value) => setProteinLevel(value as ProteinLevel)}
          />
          <OptionGrid
            columns={3}
            options={consistencyOptions}
            activeId={consistency}
            onChange={(value) => setConsistency(value as ConsistencyLevel)}
          />
        </section>

        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 shadow-[0_26px_60px_rgba(0,0,0,0.28)] backdrop-blur-[26px]">
          <div className="flex items-center justify-between gap-3">
            <SectionLabel
              title="Body Projection"
              caption={`Current state vs projected state over ${simulation.timeframeLabel}.`}
            />
            <div className="rounded-full border border-white/10 bg-black/20 p-1">
              <div className="flex items-center gap-1">
                {bodyViewOptions.map((option) => {
                  const active = option.id === bodyView;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setBodyView(option.id)}
                      className={`rounded-full px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition ${
                        active
                          ? "bg-white text-[#091318]"
                          : "text-white/58 hover:text-white/82"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <BodyStateCard
              label="Current"
              subtitle="Baseline estimate"
              metrics={simulation.current}
              bodyModel={bodyModel}
              bodyView={bodyView}
              mapValues={simulation.currentMap}
              scaleValues={simulation.currentScale}
              tone="current"
            />
            <BodyStateCard
              label="Projected"
              subtitle={simulation.timeframeLabel}
              metrics={simulation.projected}
              bodyModel={bodyModel}
              bodyView={bodyView}
              mapValues={simulation.projectedMap}
              scaleValues={simulation.projectedScale}
              tone="projected"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {simulation.topChanges.map((change) => (
              <span
                key={change.label}
                className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[0.68rem] font-medium text-emerald-50/88"
              >
                {change.label} +{change.deltaPercent}%
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_24px_56px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
          <SectionLabel
            title="Projected Metrics"
            caption="All circumference values are simulated estimates, shown in inches."
          />
          <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/18">
            <MetricHeader />
            <MetricRow label="Body Weight" unit="lb" current={simulation.current.weight} projected={simulation.projected.weight} decimals={1} />
            <MetricRow
              label="Body Fat"
              unit="%"
              current={simulation.current.bodyFat}
              projected={simulation.projected.bodyFat}
              decimals={1}
              positiveIsGood={false}
            />
            <MetricRow label="Lean Mass" unit="lb" current={simulation.current.leanMass} projected={simulation.projected.leanMass} decimals={1} />
            <MetricRow label="Shoulders" unit="in" current={simulation.current.shoulders} projected={simulation.projected.shoulders} decimals={1} />
            <MetricRow label="Chest" unit="in" current={simulation.current.chest} projected={simulation.projected.chest} decimals={1} />
            <MetricRow label="Arms" unit="in" current={simulation.current.arms} projected={simulation.projected.arms} decimals={1} />
            <MetricRow
              label="Waist"
              unit="in"
              current={simulation.current.waist}
              projected={simulation.projected.waist}
              decimals={1}
              positiveIsGood={false}
            />
            <MetricRow label="Thighs" unit="in" current={simulation.current.thighs} projected={simulation.projected.thighs} decimals={1} />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-4">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_24px_56px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
            <SectionLabel
              title="Selected Strength Metrics"
              caption="Estimated training-performance shifts based on the chosen focus, split, consistency, and recovery load."
            />
            <div className="mt-4 grid grid-cols-1 gap-3">
              {simulation.strengthMetrics.map((metric) => (
                <StrengthMetricCard key={metric.key} metric={metric} />
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_24px_56px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
            <SectionLabel
              title="Model Factors"
              caption="The simulator derives these internal levers from your setup."
            />
            <div className="mt-4 space-y-3">
              <FactorBar label="Volume" value={simulation.modelFactors.volume} />
              <FactorBar label="Intensity" value={simulation.modelFactors.intensity} />
              <FactorBar label="Frequency" value={simulation.modelFactors.frequency} />
              <FactorBar label="Recovery" value={simulation.modelFactors.recovery} />
              <FactorBar label="Fatigue" value={simulation.modelFactors.fatigue} invert />
            </div>
          </section>
        </div>

        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_24px_56px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
          <SectionLabel
            title="Progress Curves"
            caption="Projected change unfolds smoothly rather than linearly; later weeks flatten if fatigue rises."
          />
          <div className="grid grid-cols-1 gap-3">
            <TrendCard
              title="Body Weight"
              unit="lb"
              accent="cyan"
              points={simulation.timeline}
              values={simulation.timeline.map((point) => point.weight)}
              current={simulation.current.weight}
              projected={simulation.projected.weight}
            />
            <TrendCard
              title="Lean Mass"
              unit="lb"
              accent="emerald"
              points={simulation.timeline}
              values={simulation.timeline.map((point) => point.leanMass)}
              current={simulation.current.leanMass}
              projected={simulation.projected.leanMass}
            />
            <TrendCard
              title="Body Fat"
              unit="%"
              accent="amber"
              points={simulation.timeline}
              values={simulation.timeline.map((point) => point.bodyFat)}
              current={simulation.current.bodyFat}
              projected={simulation.projected.bodyFat}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_24px_56px_rgba(0,0,0,0.24)] backdrop-blur-[24px]">
          <SectionLabel
            title="Projected Insights"
            caption="Interpretive notes generated from the same adaptation model."
          />
          <div className="grid grid-cols-1 gap-3">
            {simulation.insights.map((insight) => (
              <div
                key={insight.title}
                className="rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-3.5"
              >
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/52">
                  {insight.title}
                </p>
                <p className="mt-2 text-[0.8rem] leading-6 text-white/78">{insight.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-[1.6rem] border border-white/10 bg-black/18 px-4 py-3.5 text-[0.75rem] leading-6 text-white/62">
          This is a heuristic physique simulator for portfolio purposes. It is not medical guidance,
          not a diagnostic tool, and not a substitute for coaching, lab work, or individualized
          care.
        </div>
      </div>
    </div>
  );
}

function SectionLabel({
  title,
  caption,
}: {
  title: string;
  caption: string;
}) {
  return (
    <div>
      <p className="text-[0.68rem] uppercase tracking-[0.22em] text-white/54">{title}</p>
      <p className="mt-2 text-[0.78rem] leading-6 text-white/68">{caption}</p>
    </div>
  );
}

function OptionGrid({
  options,
  activeId,
  onChange,
  columns,
}: {
  options: ReadonlyArray<{
    id: string;
    label: string;
    caption: string;
  }>;
  activeId: string;
  onChange: (id: string) => void;
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
            className={`rounded-[1.2rem] border px-3 py-3 text-left transition ${
              active
                ? "border-emerald-300/28 bg-emerald-300/14 shadow-[0_12px_30px_rgba(59,225,191,0.16)]"
                : "border-white/10 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.045]"
            }`}
          >
            <p className={`text-[0.76rem] font-semibold ${active ? "text-white" : "text-white/82"}`}>
              {option.label}
            </p>
            <p className="mt-1 text-[0.65rem] leading-5 text-white/52">{option.caption}</p>
          </button>
        );
      })}
    </div>
  );
}

function BodyStateCard({
  label,
  subtitle,
  metrics,
  bodyModel,
  bodyView,
  mapValues,
  scaleValues,
  tone,
}: {
  label: string;
  subtitle: string;
  metrics: BodyMetrics;
  bodyModel: BodyModel;
  bodyView: BodyView;
  mapValues: Record<MuscleKey, number>;
  scaleValues: Record<MuscleKey, number>;
  tone: "current" | "projected";
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-black/18 px-3 py-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/52">{label}</p>
          <p className="mt-1 text-[0.72rem] text-white/58">{subtitle}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.18em] ${
            tone === "projected"
              ? "border border-emerald-300/22 bg-emerald-300/12 text-emerald-100/82"
              : "border border-white/10 bg-white/[0.04] text-white/62"
          }`}
        >
          {bodyView}
        </span>
      </div>

      <div className="mt-3 flex justify-center">
        <AnatomyDiagram
          bodyModel={bodyModel}
          bodyView={bodyView}
          mapValues={mapValues}
          scaleValues={scaleValues}
          tone={tone}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <SmallMetric title="Weight" value={`${metrics.weight.toFixed(1)} lb`} />
        <SmallMetric title="Body Fat" value={`${metrics.bodyFat.toFixed(1)}%`} />
        <SmallMetric title="Lean" value={`${metrics.leanMass.toFixed(1)} lb`} />
      </div>
    </div>
  );
}

function SmallMetric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-white/8 bg-white/[0.03] px-2.5 py-2.5 text-center">
      <p className="text-[0.58rem] uppercase tracking-[0.16em] text-white/42">{title}</p>
      <p className="mt-1 text-[0.72rem] font-semibold text-white/86">{value}</p>
    </div>
  );
}

function MetricHeader() {
  return (
    <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.75fr] items-center gap-3 border-b border-white/10 px-4 py-3 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/46">
      <span>Metric</span>
      <span className="text-right">Current</span>
      <span className="text-right">Projected</span>
      <span className="text-right">Delta</span>
    </div>
  );
}

function MetricRow({
  label,
  unit,
  current,
  projected,
  decimals,
  positiveIsGood = true,
}: {
  label: string;
  unit: string;
  current: number;
  projected: number;
  decimals: number;
  positiveIsGood?: boolean;
}) {
  const delta = projected - current;
  const positive = delta >= 0;
  const good = positiveIsGood ? positive : !positive;
  const deltaColor = delta === 0 ? "text-white/44" : good ? "text-emerald-200" : "text-amber-200";

  return (
    <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.75fr] items-center gap-3 border-b border-white/6 px-4 py-3 text-[0.76rem] text-white/82 last:border-b-0">
      <span className="text-white/76">{label}</span>
      <span className="text-right">
        {current.toFixed(decimals)}
        {unit}
      </span>
      <span className="text-right font-medium text-white">
        {projected.toFixed(decimals)}
        {unit}
      </span>
      <span className={`text-right font-medium ${deltaColor}`}>
        {delta >= 0 ? "+" : ""}
        {delta.toFixed(decimals)}
      </span>
    </div>
  );
}

function StrengthMetricCard({ metric }: { metric: StrengthMetricResult }) {
  const delta = metric.projected - metric.current;

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/46">Estimated</p>
          <p className="mt-1 text-[0.84rem] font-semibold text-white">{metric.label}</p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[0.64rem] font-semibold text-emerald-100/82">
          {delta >= 0 ? "+" : ""}
          {metric.unit === "lb" ? roundTo(delta, 0).toFixed(0) : delta.toFixed(1)} {metric.unit}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/42">Current</p>
          <p className="mt-1 text-[1rem] font-semibold text-white/78">
            {formatStrengthValue(metric.current, metric.unit)}
          </p>
        </div>
        <span className="mb-1 text-[1.1rem] text-white/24">→</span>
        <div className="text-right">
          <p className="text-[0.62rem] uppercase tracking-[0.14em] text-white/42">Projected</p>
          <p className="mt-1 text-[1rem] font-semibold text-white">
            {formatStrengthValue(metric.projected, metric.unit)}
          </p>
        </div>
      </div>
    </div>
  );
}

function FactorBar({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: number;
  invert?: boolean;
}) {
  const width = clamp(value, 0, 1) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[0.72rem] text-white/68">
        <span>{label}</span>
        <span>{Math.round(width)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/8">
        <div
          className={`h-2 rounded-full ${
            invert
              ? "bg-[linear-gradient(90deg,#f59e0b,#f97316)]"
              : "bg-[linear-gradient(90deg,#47d7c4,#8ff3dc)]"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function TrendCard({
  title,
  unit,
  accent,
  points,
  values,
  current,
  projected,
}: {
  title: string;
  unit: string;
  accent: "cyan" | "emerald" | "amber";
  points: TimelinePoint[];
  values: number[];
  current: number;
  projected: number;
}) {
  const accentClasses = {
    cyan: {
      line: "#67e8f9",
      fill: "rgba(103,232,249,0.18)",
      pill: "text-cyan-100",
    },
    emerald: {
      line: "#6ee7b7",
      fill: "rgba(110,231,183,0.18)",
      pill: "text-emerald-100",
    },
    amber: {
      line: "#fbbf24",
      fill: "rgba(251,191,36,0.18)",
      pill: "text-amber-100",
    },
  }[accent];

  const chartWidth = 300;
  const chartHeight = 92;
  const path = buildLinePath(values, chartWidth, chartHeight, 12);
  const areaPath = buildAreaPath(values, chartWidth, chartHeight, 12);

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.16em] text-white/46">{title}</p>
          <p className="mt-1 text-[0.78rem] text-white/62">
            {current.toFixed(1)}
            {unit} → {projected.toFixed(1)}
            {unit}
          </p>
        </div>
        <span className={`rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.64rem] font-medium ${accentClasses.pill}`}>
          {points[points.length - 1]?.label}
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-[1rem] border border-white/8 bg-[#081015]">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[6.2rem] w-full">
          <path d={areaPath} fill={accentClasses.fill} />
          <path
            d={path}
            fill="none"
            stroke={accentClasses.line}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="mt-2 flex items-center justify-between text-[0.62rem] uppercase tracking-[0.14em] text-white/34">
        <span>{points[0]?.label}</span>
        <span>{points[Math.floor(points.length / 2)]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function AnatomyDiagram({
  bodyModel,
  bodyView,
  mapValues,
  scaleValues,
  tone,
}: {
  bodyModel: BodyModel;
  bodyView: BodyView;
  mapValues: Record<MuscleKey, number>;
  scaleValues: Record<MuscleKey, number>;
  tone: "current" | "projected";
}) {
  const silhouetteColor = tone === "projected" ? "rgba(92,255,218,0.18)" : "rgba(141,161,176,0.16)";
  const outlineColor = tone === "projected" ? "rgba(206,255,246,0.34)" : "rgba(255,255,255,0.18)";
  const headScale = bodyModel === "female" ? 0.98 : 1;
  const lowerBodyScale = bodyModel === "female" ? 1.04 : 0.98;
  const upperBodyScale = bodyModel === "female" ? 0.96 : 1.04;

  return (
    <svg viewBox="0 0 180 360" className="h-[18rem] w-full max-w-[10rem]">
      <defs>
        <linearGradient id={`bodyBase-${tone}`} x1="0" x2="1">
          <stop offset="0%" stopColor={silhouetteColor} />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>
      </defs>

      <g>
        <circle
          cx="90"
          cy="34"
          r={20 * headScale}
          fill={`url(#bodyBase-${tone})`}
          stroke={outlineColor}
          strokeWidth="1.2"
        />
        <rect
          x="84"
          y="50"
          width="12"
          height="16"
          rx="6"
          fill={`url(#bodyBase-${tone})`}
          stroke={outlineColor}
          strokeWidth="1.2"
        />
        <path
          d="M90 64 C72 64 60 76 58 94 C44 98 34 112 30 130 C26 150 30 174 42 192 C50 204 58 214 62 224 L62 256 C62 286 60 314 64 344 L78 344 C82 320 82 292 82 264 C82 244 86 226 90 218 C94 226 98 244 98 264 C98 292 98 320 102 344 L116 344 C120 314 118 286 118 256 L118 224 C122 214 130 204 138 192 C150 174 154 150 150 130 C146 112 136 98 122 94 C120 76 108 64 90 64 Z"
          fill={`url(#bodyBase-${tone})`}
          stroke={outlineColor}
          strokeWidth="1.2"
        />
      </g>

      {anatomyRegions[bodyView].map((region) => {
        const regionKey = region.key;
        const score = clamp(mapValues[regionKey], 0.12, 1);
        const scaleBase =
          regionKey === "shoulders" || regionKey === "chest" || regionKey === "upperBack" || regionKey === "lats"
            ? upperBodyScale
            : regionKey === "glutes" || regionKey === "thighs" || regionKey === "hamstrings"
              ? lowerBodyScale
              : 1;
        const scale = scaleBase * scaleValues[regionKey];
        const fillColor =
          tone === "projected"
            ? `rgba(112,255,224,${(0.16 + score * 0.54).toFixed(3)})`
            : `rgba(148,167,184,${(0.1 + score * 0.28).toFixed(3)})`;
        const strokeColor =
          tone === "projected"
            ? `rgba(211,255,245,${(0.14 + score * 0.18).toFixed(3)})`
            : "rgba(255,255,255,0.08)";
        const transform = `translate(${region.anchor.x} ${region.anchor.y}) scale(${scale}) translate(${-region.anchor.x} ${-region.anchor.y})`;

        return (
          <g key={`${bodyView}-${regionKey}`} transform={transform}>
            {region.shapes.map((shape, index) => (
              <AnatomyShape
                key={`${regionKey}-${index}`}
                shape={shape}
                fill={fillColor}
                stroke={strokeColor}
              />
            ))}
          </g>
        );
      })}

      <line x1="90" y1="68" x2="90" y2="206" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
    </svg>
  );
}

function AnatomyShape({
  shape,
  fill,
  stroke,
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
        strokeWidth="1"
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
        strokeWidth="1"
        transform={shape.rotate ? `rotate(${shape.rotate} ${centerX} ${centerY})` : undefined}
      />
    );
  }

  return <path d={shape.d} fill={fill} stroke={stroke} strokeWidth="1" />;
}

function simulatePhysique(args: {
  bodyModel: BodyModel;
  trainingFocus: TrainingFocus;
  workoutSplit: WorkoutSplit;
  calorieTarget: CalorieTarget;
  proteinLevel: ProteinLevel;
  consistency: ConsistencyLevel;
  timeframe: TimeframeId;
}): SimulationResult {
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
  const focusAverage = Object.values(focus.emphasis).reduce((sum, value) => sum + value, 0) / 10;
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
  leanGain = clamp(leanGain, args.bodyModel === "male" ? -0.6 : -0.4, args.bodyModel === "male" ? 5.6 : 4.1);

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

  fatChange = clamp(fatChange, args.bodyModel === "male" ? -9.5 : -8.2, args.calorieTarget === "lean_gain" ? 4.5 : 1.2);

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
      base.shoulders + leanGain * (0.16 + focus.emphasis.shoulders * 0.11) + Math.max(definitionSignal, 0) * 0.12,
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
    const definitionBoost = key === "core" ? Math.max(definitionSignal, 0) * 0.22 : 0;
    projectedMap[key] = clamp(
      currentMap[key] + emphasis * 0.34 * leanSignal + definitionBoost + Math.max(surplusSignal, 0) * 0.04,
      0.12,
      1,
    );

    if (key === "core") {
      projectedScale[key] = clamp(
        currentScale[key] + fatChange * 0.003 - Math.max(definitionSignal, 0) * 0.028,
        0.9,
        1.04,
      );
      return;
    }

    projectedScale[key] = clamp(
      currentScale[key] + emphasis * 0.05 * leanSignal + Math.max(surplusSignal, 0) * 0.008,
      0.92,
      1.16,
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

    const projected = roundToNearest(current * (1 + strengthFactor), 5);

    return {
      key,
      label: metric.label,
      unit: metric.unit,
      current,
      projected,
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
  const calorieInsight =
    args.calorieTarget === "cut"
      ? "The model prioritizes waist reduction and body-fat decline, with slower scale changes in lean tissue."
      : args.calorieTarget === "maintain"
        ? "The model favors recomposition, so visible change is driven more by shape and definition than dramatic scale movement."
        : "A small surplus pushes stronger lean-mass potential, but the simulator also allows a modest rise in scale weight and waist softness.";
  const fatigueLabel =
    fatigueIndex > 0.62 ? "high" : fatigueIndex > 0.46 ? "moderate" : "controlled";

  const insights = [
    {
      title: "Primary Response",
      body: `${primaryChange} and ${secondaryChange} carry the biggest simulated adaptation load under this setup, so the body map shifts there first before total size changes become obvious.`,
    },
    {
      title: "Fueling Effect",
      body: `${calorieInsight} Protein at ${proteinOptions.find((option) => option.id === args.proteinLevel)?.label ?? "target"} and ${consistency.label} keep the projection smooth rather than exaggerated.`,
    },
    {
      title: "Recovery Constraint",
      body: `Derived model factors land at ${Math.round(volume * 100)}% volume, ${Math.round(intensity * 100)}% intensity, and ${fatigueLabel} fatigue. If recovery quality drops, the later part of the block flattens before the full visual projection is reached.`,
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
    const fatigueWave = 1 - args.fatigueIndex * 0.06 * Math.sin((index / (totalPoints - 1)) * Math.PI);
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
