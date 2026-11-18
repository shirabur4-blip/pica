export type RehabStageId = 1 | 2 | 3 | 4;

export type OperatedSide = 'right' | 'left';

export type WeightBearingLevel = 'none' | 'toe_touch' | 'partial' | 'full_in_brace' | 'full';

export type PacePreference = 'gentle' | 'balanced' | 'progressive';

export type SwellingLevel = 'none' | 'mild' | 'moderate' | 'severe';

export type SymptomContext = 'morning' | 'rest' | 'during_exercise' | 'after_exercise' | 'evening';

export type ClearanceStatus = 'cleared' | 'pending_consultation' | 'locked';

export interface PatientProfile {
  name: string;
  surgeryDate: string; // YYYY-MM-DD
  operatedSide: OperatedSide;
  allowedBraceFlexionDeg: number; // 0, 30, 60, 90, 120, 140
  weightBearing: WeightBearingLevel;
  pacePreference: PacePreference;
  largeTextMode: boolean;
}

export interface StageClearanceRecord {
  stageId: RehabStageId;
  status: ClearanceStatus;
  clinicianName?: string;
  clinicianRole?: 'orthopedist' | 'physiotherapist';
  clearedDate?: string;
  notes?: string;
  checkedCriteriaIds: string[];
  patientQuestions: string;
}

export interface RehabStage {
  id: RehabStageId;
  title: string;
  timeframeLabel: string;
  summary: string;
  clinicalGoal: string;
  braceProtocol: string;
  weightBearingProtocol: string;
  readinessCriteria: {
    id: string;
    label: string;
  }[];
  consultationQuestions: string[];
  requiresClinicianClearance: boolean;
}

export interface ExerciseDefinition {
  id: string;
  stageId: RehabStageId;
  title: string;
  englishName: string;
  category: 'activation' | 'mobility' | 'strength' | 'balance';
  imageUrl: string;
  imageAlt: string;
  baseSets: number;
  baseReps: number;
  holdSeconds: number;
  restSeconds: number;
  frequencyPerDay: string;
  requiresBraceLocked: boolean;
  minAllowedBraceAngle: number; // minimum cleared brace angle required to perform safely
  requiresWeightBearing: boolean;
  steps: string[];
  safetyFocus: string[];
  avoidMistakes: string[];
  encouragementTip: string;
}

export interface PersonalizedExercise extends ExerciseDefinition {
  personalizedSets: number;
  personalizedReps: number;
  personalizedHoldSeconds: number;
  sideInstruction: string;
  braceInstruction: string;
  isSafeForCurrentLimits: boolean;
  safetyLockReason?: string;
}

export interface DailyLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  painLevel: number; // 1-10
  stiffnessLevel: number; // 1-10
  swellingLevel: SwellingLevel;
  flexionDegrees: number | null; // 0-140
  extensionZeroAchieved: boolean;
  context: SymptomContext;
  notes: string;
  createdAt: string;
}

export interface PainSafetyEvaluation {
  level: 'safe' | 'caution' | 'stop_consult';
  title: string;
  guidance: string;
}

export interface DashboardMetrics {
  todayCompletedCount: number;
  todayTotalSafeCount: number;
  todayCompletionPercent: number;
  latestPain: number | null;
  latestStiffness: number | null;
  latestFlexion: number | null;
  sevenDayAvgPain: number | null;
  sevenDayAvgStiffness: number | null;
  painTrendDirection: 'improving' | 'stable' | 'worsening' | 'insufficient';
  streakDays: number;
}

export interface MedicalTeamSummary {
  generatedDate: string;
  daysPostOp: number;
  currentWeek: number;
  activeStageTitle: string;
  totalLogsCount: number;
  avgPain7Days: number | null;
  avgStiffness7Days: number | null;
  maxPainRecorded: number | null;
  latestFlexionDeg: number | null;
  maxFlexionDeg: number | null;
  moderateOrSevereSwellingDays: number;
  painTrendLabel: string;
  highPainAlertsCount: number;
  formattedReportText: string;
}
