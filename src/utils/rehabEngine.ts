import { REHAB_STAGES, SWELLING_LABELS } from '../data/rehabProtocol';
import type {
  DailyLogEntry,
  DashboardMetrics,
  ExerciseDefinition,
  MedicalTeamSummary,
  PainSafetyEvaluation,
  PatientProfile,
  PersonalizedExercise,
  RehabStage,
  RehabStageId,
  StageClearanceRecord,
  SwellingLevel,
} from '../types/rehab';

export function calculateDaysPostOp(surgeryDateStr: string, referenceDateStr?: string): number {
  const surgery = new Date(`${surgeryDateStr}T00:00:00`);
  const ref = referenceDateStr ? new Date(`${referenceDateStr}T00:00:00`) : new Date();
  if (Number.isNaN(surgery.getTime()) || Number.isNaN(ref.getTime())) {
    return 0;
  }
  const refMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const diffMs = refMidnight.getTime() - surgery.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function calculateCurrentWeek(daysPostOp: number): number {
  if (daysPostOp <= 0) return 1;
  return Math.floor(daysPostOp / 7) + 1;
}

export function getRecommendedStageByDays(daysPostOp: number): RehabStageId {
  if (daysPostOp < 14) return 1;
  if (daysPostOp < 42) return 2;
  if (daysPostOp < 84) return 3;
  return 4;
}

export function canUnlockStage(
  targetStageId: RehabStageId,
  clearances: Record<RehabStageId, StageClearanceRecord>
): { allowed: boolean; reason?: string } {
  if (targetStageId === 1) {
    return { allowed: true };
  }
  const prevStageId = (targetStageId - 1) as RehabStageId;
  const prevClearance = clearances[prevStageId];
  if (!prevClearance || prevClearance.status !== 'cleared') {
    return {
      allowed: false,
      reason: `יש להשלים התייעצות ואישור רפואי לשלב ${prevStageId} לפני פתיחת שלב ${targetStageId}.`,
    };
  }
  return { allowed: true };
}

export function personalizeExercise(
  exercise: ExerciseDefinition,
  profile: PatientProfile
): PersonalizedExercise {
  const paceMultiplier =
    profile.pacePreference === 'gentle' ? 0.8 : profile.pacePreference === 'progressive' ? 1.2 : 1;

  const personalizedReps = Math.max(5, Math.round(exercise.baseReps * paceMultiplier));
  const personalizedSets =
    profile.pacePreference === 'gentle' && exercise.baseSets > 2 ? exercise.baseSets - 1 : exercise.baseSets;
  const personalizedHoldSeconds =
    profile.pacePreference === 'gentle'
      ? Math.max(2, exercise.holdSeconds - 1)
      : profile.pacePreference === 'progressive'
        ? exercise.holdSeconds + 1
        : exercise.holdSeconds;

  const sideText = profile.operatedSide === 'right' ? 'רגל ימין (המנותחת)' : 'רגל שמאל (המנותחת)';
  const sideInstruction = `מיקוד התרגיל: ${sideText}.`;

  let braceInstruction = '';
  if (exercise.requiresBraceLocked) {
    braceInstruction = 'יש לבצע כשהסד נעול ביישור מלא (0°) אלא אם המנתח אישר אחרת.';
  } else if (exercise.minAllowedBraceAngle > 0) {
    braceInstruction = `טווח כיפוף מקסימלי מוגדר אצלך כעת: עד ${profile.allowedBraceFlexionDeg}°.`;
  } else {
    braceInstruction = 'ניתן לבצע במנוחה בהתאם להנחיית הסד הנוכחית שלך.';
  }

  let isSafeForCurrentLimits = true;
  let safetyLockReason: string | undefined;

  if (profile.allowedBraceFlexionDeg < exercise.minAllowedBraceAngle) {
    isSafeForCurrentLimits = false;
    safetyLockReason = `דורש אישור טווח כיפוף של ${exercise.minAllowedBraceAngle}° לפחות (הגבול הנוכחי שלך: ${profile.allowedBraceFlexionDeg}°). התייעצו עם הרופא או הפיזיותרפיסט לפני ביצוע.`;
  } else if (
    exercise.requiresWeightBearing &&
    (profile.weightBearing === 'none' || profile.weightBearing === 'toe_touch')
  ) {
    isSafeForCurrentLimits = false;
    safetyLockReason = 'תרגיל זה דורש היתר לדריכה חלקית או מלאה. בהתאם להגדרת הדריכה שלך כעת, יש להמתין לאישור רפואי.';
  }

  return {
    ...exercise,
    personalizedSets,
    personalizedReps,
    personalizedHoldSeconds,
    sideInstruction,
    braceInstruction,
    isSafeForCurrentLimits,
    safetyLockReason,
  };
}

export function evaluatePainSafety(painLevel: number, swellingLevel: SwellingLevel): PainSafetyEvaluation {
  if (painLevel >= 8 || (painLevel >= 7 && swellingLevel === 'severe')) {
    return {
      level: 'stop_consult',
      title: 'כאב גבוה או נפיחות חריגה — מומלץ לעצור ולהתייעץ',
      guidance:
        'רמת הכאב שדיווחת גבוהה מהטווח הבטוח לשיקום. מומלץ להפסיק תרגול מאומץ להיום, להניח קרח עטוף במגבת, להרים את הרגל וליצור קשר עם הרופא המטפל או הפיזיותרפיסט.',
    };
  }
  if (painLevel >= 5 || swellingLevel === 'moderate' || swellingLevel === 'severe') {
    return {
      level: 'caution',
      title: 'עומס בינוני — מומלץ למתן את קצב התרגול',
      guidance:
        'הברך מאותתת על רגישות מסוימת. העדיפו תרגילי הפעלה עדינים (כיווץ איזומטרי ותנועות קרסול), קצרו חזרות והקפידו על מנוחה והרמת רגל.',
    };
  }
  return {
    level: 'safe',
    title: 'טווח בטוח ומעודד להמשך תרגול',
    guidance: 'רמת הכאב והנפיחות מאפשרות תרגול מבוקר בקצב שלך. המשיכו להקשיב לגוף ושמרו על טכניקה נקייה.',
  };
}

export function computeDashboardMetrics(
  logs: DailyLogEntry[],
  completedTodayIds: string[],
  safeExercisesToday: PersonalizedExercise[]
): DashboardMetrics {
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const latest = sortedLogs[0] ?? null;

  const recent7 = sortedLogs.slice(0, 7);
  const sevenDayAvgPain =
    recent7.length > 0
      ? Number((recent7.reduce((sum, item) => sum + item.painLevel, 0) / recent7.length).toFixed(1))
      : null;
  const sevenDayAvgStiffness =
    recent7.length > 0
      ? Number((recent7.reduce((sum, item) => sum + item.stiffnessLevel, 0) / recent7.length).toFixed(1))
      : null;

  const latestWithFlexion = sortedLogs.find((item) => item.flexionDegrees !== null) ?? null;

  let painTrendDirection: DashboardMetrics['painTrendDirection'] = 'insufficient';
  if (sortedLogs.length >= 4) {
    const recent3 = sortedLogs.slice(0, 3);
    const prev3 = sortedLogs.slice(3, 6);
    const recentAvg = recent3.reduce((s, l) => s + l.painLevel, 0) / recent3.length;
    const prevAvg = prev3.reduce((s, l) => s + l.painLevel, 0) / prev3.length;
    const diff = recentAvg - prevAvg;
    if (diff <= -0.6) painTrendDirection = 'improving';
    else if (diff >= 0.6) painTrendDirection = 'worsening';
    else painTrendDirection = 'stable';
  }

  const todayTotalSafeCount = safeExercisesToday.length;
  const safeIdSet = new Set(safeExercisesToday.map((ex) => ex.id));
  const todayCompletedCount = completedTodayIds.filter((id) => safeIdSet.has(id)).length;
  const todayCompletionPercent =
    todayTotalSafeCount > 0 ? Math.round((todayCompletedCount / todayTotalSafeCount) * 100) : 0;

  // Compute unique logged days streak / count
  const uniqueDates = Array.from(new Set(sortedLogs.map((l) => l.date))).sort((a, b) => b.localeCompare(a));

  return {
    todayCompletedCount,
    todayTotalSafeCount,
    todayCompletionPercent,
    latestPain: latest ? latest.painLevel : null,
    latestStiffness: latest ? latest.stiffnessLevel : null,
    latestFlexion: latestWithFlexion ? latestWithFlexion.flexionDegrees : null,
    sevenDayAvgPain,
    sevenDayAvgStiffness,
    painTrendDirection,
    streakDays: uniqueDates.length,
  };
}

export function buildMedicalTeamSummary(
  profile: PatientProfile,
  activeStage: RehabStage,
  logs: DailyLogEntry[],
  clearances: Record<RehabStageId, StageClearanceRecord>,
  referenceDateStr?: string
): MedicalTeamSummary {
  const daysPostOp = calculateDaysPostOp(profile.surgeryDate, referenceDateStr);
  const currentWeek = calculateCurrentWeek(daysPostOp);
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const recent7 = sortedLogs.slice(0, 7);

  const avgPain7Days =
    recent7.length > 0
      ? Number((recent7.reduce((s, l) => s + l.painLevel, 0) / recent7.length).toFixed(1))
      : null;
  const avgStiffness7Days =
    recent7.length > 0
      ? Number((recent7.reduce((s, l) => s + l.stiffnessLevel, 0) / recent7.length).toFixed(1))
      : null;

  const maxPainRecorded =
    sortedLogs.length > 0 ? Math.max(...sortedLogs.map((l) => l.painLevel)) : null;

  const flexionValues = sortedLogs
    .map((l) => l.flexionDegrees)
    .filter((v): v is number => typeof v === 'number');
  const latestFlexionDeg = flexionValues.length > 0 ? flexionValues[0] : null;
  const maxFlexionDeg = flexionValues.length > 0 ? Math.max(...flexionValues) : null;

  const moderateOrSevereSwellingDays = recent7.filter(
    (l) => l.swellingLevel === 'moderate' || l.swellingLevel === 'severe'
  ).length;
  const highPainAlertsCount = sortedLogs.filter((l) => l.painLevel >= 7).length;

  const metrics = computeDashboardMetrics(logs, [], []);
  const painTrendMap: Record<DashboardMetrics['painTrendDirection'], string> = {
    improving: 'מגמת שיפור וירידה בכאב',
    stable: 'רמת כאב יציבה',
    worsening: 'עלייה ברמת הכאב — דורש הערכה',
    insufficient: 'נדרשים עוד מספר ימי מעקב לקביעת מגמה',
  };

  const todayFormatted = referenceDateStr ?? new Date().toISOString().slice(0, 10);
  const stageClearance = clearances[activeStage.id];
  const latestLog = sortedLogs[0];

  const lines = [
    `סיכום מעקב שיקום לצוות הרפואי — ${profile.name}`,
    `תאריך הפקה: ${todayFormatted} | ימים מהניתוח: ${daysPostOp} (שבוע ${currentWeek})`,
    `צד מנותח: ${profile.operatedSide === 'right' ? 'ברך ימין' : 'ברך שמאל'} | גבול כיפוף מאושר בסד: ${profile.allowedBraceFlexionDeg}°`,
    `שלב נוכחי: ${activeStage.title}`,
    stageClearance?.clinicianName
      ? `אישור שלב נוכחי: ${stageClearance.clinicianName} (${stageClearance.clearedDate ?? ''})`
      : 'סטטוס אישור שלב: ממתין להתייעצות רפואית',
    '',
    'מדדי כאב ותסמינים (7 דיווחים אחרונים):',
    `- ממוצע כאב (1–10): ${avgPain7Days ?? 'אין נתונים'} (${painTrendMap[metrics.painTrendDirection]})`,
    `- ממוצע נוקשות (1–10): ${avgStiffness7Days ?? 'אין נתונים'}`,
    `- ימים עם נפיחות בינונית/משמעותית: ${moderateOrSevereSwellingDays} מתוך ${recent7.length}`,
    `- אירועי כאב גבוה (7+): ${highPainAlertsCount}`,
    `- טווח כיפוף ברך עדכני: ${latestFlexionDeg !== null ? `${latestFlexionDeg}°` : 'לא נמדד'} (שיא מתועד: ${maxFlexionDeg !== null ? `${maxFlexionDeg}°` : 'לא נמדד'})`,
    latestLog
      ? `- דיווח אחרון (${latestLog.date}): כאב ${latestLog.painLevel}/10, נוקשות ${latestLog.stiffnessLevel}/10, ${SWELLING_LABELS[latestLog.swellingLevel].label}${latestLog.notes ? ` | הערה: ${latestLog.notes}` : ''}`
      : '- טרם תועד דיווח יומי',
  ];

  return {
    generatedDate: todayFormatted,
    daysPostOp,
    currentWeek,
    activeStageTitle: activeStage.title,
    totalLogsCount: logs.length,
    avgPain7Days,
    avgStiffness7Days,
    maxPainRecorded,
    latestFlexionDeg,
    maxFlexionDeg,
    moderateOrSevereSwellingDays,
    painTrendLabel: painTrendMap[metrics.painTrendDirection],
    highPainAlertsCount,
    formattedReportText: lines.join('\n'),
  };
}

export function getStageById(id: RehabStageId): RehabStage {
  return REHAB_STAGES.find((s) => s.id === id) ?? REHAB_STAGES[0];
}
