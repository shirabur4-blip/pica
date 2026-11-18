import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Play,
  SlidersHorizontal,
  Stethoscope,
  Type,
} from 'lucide-react';
import type {
  DashboardMetrics,
  PatientProfile,
  PersonalizedExercise,
  RehabStage,
  StageClearanceRecord,
} from '../types/rehab';
import { WEIGHT_BEARING_LABELS } from '../data/rehabProtocol';
import { KneeAngleDiagram } from './KneeAngleDiagram';
import { SafeImage } from './SafeImage';

interface TodayWorkspaceProps {
  profile: PatientProfile;
  daysPostOp: number;
  currentWeek: number;
  activeStage: RehabStage;
  activeClearance: StageClearanceRecord;
  exercises: PersonalizedExercise[];
  completedTodayIds: string[];
  metrics: DashboardMetrics;
  onToggleComplete: (exerciseId: string) => void;
  onOpenExercise: (exercise: PersonalizedExercise) => void;
  onOpenStages: () => void;
  onOpenSafety: () => void;
  onOpenJournal: () => void;
  onToggleLargeText: () => void;
}

export function TodayWorkspace({
  profile,
  daysPostOp,
  currentWeek,
  activeStage,
  activeClearance,
  exercises,
  completedTodayIds,
  metrics,
  onToggleComplete,
  onOpenExercise,
  onOpenStages,
  onOpenSafety,
  onOpenJournal,
  onToggleLargeText,
}: TodayWorkspaceProps) {
  const firstSafeIncomplete =
    exercises.find((ex) => ex.isSafeForCurrentLimits && !completedTodayIds.includes(ex.id)) ??
    exercises.find((ex) => ex.isSafeForCurrentLimits) ??
    exercises[0];

  const isStageCleared = activeClearance.status === 'cleared';

  return (
    <div className="space-y-8">
      {/* Workspace Utility Strip (Personalization + Accessibility) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>{profile.operatedSide === 'right' ? 'ברך ימין מנותחת' : 'ברך שמאל מנותחת'}</span>
          <span aria-hidden="true">·</span>
          <span>גבול כיפוף בסד: <strong className="font-semibold text-slate-900 tabular-nums">{profile.allowedBraceFlexionDeg}°</strong></span>
          <span aria-hidden="true">·</span>
          <span>{WEIGHT_BEARING_LABELS[profile.weightBearing]}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleLargeText}
            aria-pressed={profile.largeTextMode}
            className={`inline-flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-xl border text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              profile.largeTextMode
                ? 'bg-teal-50 border-teal-300 text-teal-900'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Type className="w-4 h-4" aria-hidden="true" />
            <span>{profile.largeTextMode ? 'טקסט מוגדל: פעיל' : 'הגדלת טקסט'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenSafety}
            className="inline-flex items-center gap-2 px-3 py-2 min-h-[40px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
            <span>התאמה אישית ובטיחות</span>
          </button>
        </div>
      </div>

      {/* Encouraging Hero Split (items-stretch for balanced height) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-teal-800 font-medium">
              <span>יום <span className="tabular-nums">{daysPostOp}</span> לאחר הניתוח</span>
              <span aria-hidden="true">·</span>
              <span>שבוע <span className="tabular-nums">{currentWeek}</span></span>
              <span aria-hidden="true">·</span>
              <span>{activeStage.timeframeLabel}</span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-tight [text-wrap:balance]">
              שלום {profile.name}, מתקדמים צעד אחר צעד בביטחון
            </h1>

            <p className="text-slate-600 text-base leading-relaxed max-w-[65ch]">
              {activeStage.summary}
            </p>

            {/* Clinician Clearance Status Notice (flat hairline, no thick left border) */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-start gap-2.5 text-sm">
                {isStageCleared ? (
                  <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <Stethoscope className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <div>
                  <p className="font-semibold text-slate-900">{activeStage.title}</p>
                  <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                    {isStageCleared && activeClearance.clinicianName
                      ? `מאושר לתרגול על ידי ${activeClearance.clinicianName} (${activeClearance.clearedDate ?? ''})`
                      : 'ממתין להתייעצות ואישור רופא או פיזיותרפיסט לפני תחילת שלב זה'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenStages}
                className="text-sm font-semibold text-teal-800 hover:text-teal-900 underline underline-offset-4 whitespace-nowrap shrink-0 self-start sm:self-center cursor-pointer"
              >
                {isStageCleared ? 'כל השלבים והאישורים' : 'תיאום אישור רפואי'}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-2">
            {firstSafeIncomplete && isStageCleared ? (
              <button
                type="button"
                onClick={() => onOpenExercise(firstSafeIncomplete)}
                className="w-full sm:w-auto max-w-full inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="truncate">התחל תרגול: {firstSafeIncomplete.title}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenStages}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer"
              >
                <Stethoscope className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>מעבר לבדיקת אישור רפואי</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSafety}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>נורות אזהרה לבטיחות</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 h-48 sm:h-64 lg:h-auto lg:min-h-[240px]">
          <SafeImage
            src="/src/assets/images/recovery_hero_studio_1794680990082.jpg"
            alt="חדר שיקום מואר ושלו עם מזרן תרגול בגוון מרווה ותאורת בוקר טבעית"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* 4-Column Full-Width KPI Strip (2x2 on mobile, 4x1 on desktop) */}
      <section
        aria-label="מדדי התקדמות יומיים"
        className="bg-slate-200 border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-2 lg:grid-cols-4 gap-px"
      >
        <div className="bg-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-slate-500">השלמת תרגול היום</p>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">
            {metrics.todayCompletedCount}/{metrics.todayTotalSafeCount}
            <span className="text-sm font-sans font-normal text-slate-500 mr-2">
              ({metrics.todayCompletionPercent}%)
            </span>
          </p>
          <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: `${metrics.todayCompletionPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-slate-500">רמת כאב אחרונה (1–10)</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <p className="font-mono text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">
              {metrics.latestPain !== null ? `${metrics.latestPain}/10` : '—'}
            </p>
            <button
              type="button"
              onClick={onOpenJournal}
              className="text-xs font-medium text-teal-800 hover:underline whitespace-nowrap cursor-pointer"
            >
              עדכון יומן
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {metrics.sevenDayAvgPain !== null
              ? `ממוצע 7 ימים: ${metrics.sevenDayAvgPain}`
              : 'הוסיפו דיווח יומי ראשון'}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-slate-500">טווח כיפוף אחרון</p>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">
            {metrics.latestFlexion !== null ? `${metrics.latestFlexion}°` : '—'}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            גבול מאושר בסד: <span className="tabular-nums font-medium">{profile.allowedBraceFlexionDeg}°</span>
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm text-slate-500">רצף מעקב ותיעוד</p>
          <p className="mt-2 font-mono text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">
            {metrics.streakDays}
            <span className="text-sm font-sans font-normal text-slate-500 mr-1.5">ימים</span>
          </p>
          <p className="mt-2 text-xs text-slate-500">
            יעד קליני: {activeStage.clinicalGoal.split('(')[0].trim()}
          </p>
        </div>
      </section>

      {/* Personalized Daily Exercise List */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900">
              תרגילי התוכנית המותאמים שלך — שלב {activeStage.id}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              החזרות ומשכי ההחזקה מותאמים לקצב שלך ({profile.pacePreference === 'gentle' ? 'קצב עדין' : profile.pacePreference === 'progressive' ? 'קצב מתקדם' : 'קצב מאוזן'}) ולמגבלות הסד הנוכחיות.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {activeStage.braceProtocol}
            </p>
          </div>
          <KneeAngleDiagram
            angleDeg={profile.allowedBraceFlexionDeg}
            maxAllowedDeg={profile.allowedBraceFlexionDeg}
            size="sm"
            caption={`טווח מאושר בסד: 0°–${profile.allowedBraceFlexionDeg}°`}
            className="self-start sm:self-center shrink-0"
          />
        </div>

        {!isStageCleared && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Stethoscope className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-amber-950 text-sm sm:text-base">
                  שלב זה דורש התייעצות ואישור מרופא או פיזיותרפיסט לפני התחלה
                </p>
                <p className="text-amber-900 text-xs sm:text-sm mt-1">
                  באפשרותכם לצפות בתרגילים ולהכין שאלות לביקור, וברגע שתקבלו אישור רפואי — לתעד אותו ולפתוח את התרגול.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenStages}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              הכנה ואישור שלב
            </button>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-200">
          {exercises.map((exercise) => {
            const isDone = completedTodayIds.includes(exercise.id);
            const isBlocked = !isStageCleared || !exercise.isSafeForCurrentLimits;

            return (
              <div
                key={exercise.id}
                className={`p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors ${
                  isDone ? 'bg-teal-50/35' : 'bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start gap-4 min-w-0">
                  <div className="aspect-[4/3] w-full sm:w-44 md:w-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                    <SafeImage
                      src={exercise.imageUrl}
                      alt={exercise.imageAlt}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base sm:text-lg font-semibold text-slate-900">
                        {exercise.title}
                      </h3>
                      {isDone && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800">
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                          <span>הושלם היום</span>
                        </span>
                      )}
                    </div>

                    {/* Zero-pill unboxed metadata with typographic separators */}
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600 tabular-nums">
                      <span>{exercise.personalizedSets} סטים</span>
                      <span aria-hidden="true">·</span>
                      <span>{exercise.personalizedReps} חזרות</span>
                      <span aria-hidden="true">·</span>
                      <span>החזקה {exercise.personalizedHoldSeconds} שניות</span>
                      <span aria-hidden="true">·</span>
                      <span>{exercise.frequencyPerDay}</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500">
                      {exercise.braceInstruction}
                    </p>

                    {!exercise.isSafeForCurrentLimits && exercise.safetyLockReason && (
                      <p className="inline-flex items-start gap-1.5 text-xs sm:text-sm font-medium text-amber-800 pt-1">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{exercise.safetyLockReason}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex w-full md:w-auto items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenExercise(exercise)}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-teal-700" aria-hidden="true" />
                    <span>הדרכה וטיימר</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBlocked}
                    onClick={() => onToggleComplete(exercise.id)}
                    aria-label={
                      isDone ? `בטל סימון השלמה עבור ${exercise.title}` : `סמן ${exercise.title} כהושלם`
                    }
                    className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                      isBlocked
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isDone
                          ? 'bg-teal-100 text-teal-900 hover:bg-teal-200 cursor-pointer'
                          : 'bg-teal-700 text-white hover:bg-teal-800 cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>{isDone ? 'בוצע היום' : 'סמן כבוצע'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
