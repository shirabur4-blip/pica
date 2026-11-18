import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { PersonalizedExercise } from '../types/rehab';
import { KneeAngleDiagram } from './KneeAngleDiagram';
import { SafeImage } from './SafeImage';

interface ExerciseModalProps {
  exercise: PersonalizedExercise | null;
  isStageCleared: boolean;
  isCompletedToday: boolean;
  onClose: () => void;
  onMarkComplete: (exerciseId: string) => void;
}

type TimerPhase = 'idle' | 'hold' | 'rest' | 'finished';

export function ExerciseModal({
  exercise,
  isStageCleared,
  isCompletedToday,
  onClose,
  onMarkComplete,
}: ExerciseModalProps) {
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [currentRep, setCurrentRep] = useState(1);
  const [currentSet, setCurrentSet] = useState(1);

  useEffect(() => {
    if (!exercise) return;
    setPhase('idle');
    setIsRunning(false);
    setSecondsLeft(exercise.personalizedHoldSeconds);
    setCurrentRep(1);
    setCurrentSet(1);
  }, [exercise]);

  useEffect(() => {
    if (!exercise || !isRunning || phase === 'idle' || phase === 'finished') {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        if (phase === 'hold') {
          setPhase('rest');
          return exercise.restSeconds;
        }

        // Rest ended -> advance rep or set
        if (currentRep < exercise.personalizedReps) {
          setCurrentRep((r) => r + 1);
          setPhase('hold');
          return exercise.personalizedHoldSeconds;
        }

        if (currentSet < exercise.personalizedSets) {
          setCurrentSet((s) => s + 1);
          setCurrentRep(1);
          setPhase('hold');
          return exercise.personalizedHoldSeconds;
        }

        setPhase('finished');
        setIsRunning(false);
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [exercise, isRunning, phase, currentRep, currentSet]);

  if (!exercise) return null;

  const isLocked = !isStageCleared || !exercise.isSafeForCurrentLimits;

  const handleStartPause = () => {
    if (isLocked) return;
    if (phase === 'idle' || phase === 'finished') {
      setCurrentSet(1);
      setCurrentRep(1);
      setPhase('hold');
      setSecondsLeft(exercise.personalizedHoldSeconds);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase('idle');
    setCurrentSet(1);
    setCurrentRep(1);
    setSecondsLeft(exercise.personalizedHoldSeconds);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-3xl max-h-[92dvh] flex flex-col overflow-hidden shadow-xl">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 shrink-0" aria-hidden="true" />
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 id="exercise-modal-title" className="font-display text-base sm:text-xl font-bold text-slate-900 truncate">
              {exercise.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              {exercise.sideInstruction} · {exercise.personalizedSets} סטים × {exercise.personalizedReps} חזרות
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגור חלון תרגיל"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Visual + Guided Timer */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            <div className="md:col-span-6 aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <SafeImage
                src={exercise.imageUrl}
                alt={exercise.imageAlt}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500">טיימר תרגול מונחה</p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono text-4xl font-bold text-slate-900 tabular-nums">
                    00:{String(secondsLeft).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold text-teal-800">
                    {phase === 'idle' && 'מוכנים להתחלה'}
                    {phase === 'hold' && 'כיווץ / החזקה עדינה'}
                    {phase === 'rest' && 'הרפיה ונשימה'}
                    {phase === 'finished' && 'כל הכבוד! התרגול הסתיים'}
                  </span>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 tabular-nums">
                  סט {currentSet} מתוך {exercise.personalizedSets} · חזרה {currentRep} מתוך {exercise.personalizedReps}
                </p>
              </div>

              {isLocked ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs sm:text-sm text-amber-900 flex items-start gap-2">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    {exercise.safetyLockReason ??
                      'יש לקבל ולאשר התייעצות רפואית לשלב זה לפני תחילת התרגול.'}
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleStartPause}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold whitespace-nowrap cursor-pointer"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4" aria-hidden="true" />
                        <span>השהה</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" aria-hidden="true" />
                        <span>{phase === 'idle' || phase === 'finished' ? 'הפעל טיימר' : 'המשך'}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    aria-label="אפס טיימר"
                    className="inline-flex items-center justify-center px-3 py-2.5 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Brace Notice + Visual Angle Reference */}
          <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-teal-950 leading-relaxed">
              <strong className="font-semibold">הנחיית סד מותאמת: </strong>
              {exercise.braceInstruction}
            </div>
            <KneeAngleDiagram
              angleDeg={exercise.minAllowedBraceAngle}
              maxAllowedDeg={
                exercise.requiresBraceLocked ? 0 : Math.max(exercise.minAllowedBraceAngle, 90)
              }
              size="sm"
              caption={
                exercise.requiresBraceLocked
                  ? 'ברך ישרה בסד (0°)'
                  : `זווית בסיס לתרגיל: ${exercise.minAllowedBraceAngle}°`
              }
              className="self-center sm:self-auto shrink-0"
            />
          </div>

          {/* Proper Execution Steps */}
          <div className="space-y-2.5">
            <h3 className="font-display text-base font-bold text-slate-900">אופן הביצוע הנכון</h3>
            <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
              {exercise.steps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Safety Focus & Mistakes to Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-teal-800 font-semibold text-sm">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>דגשים לבטיחות וביצוע נכון</span>
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {exercise.safetyFocus.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>ממה חשוב להימנע</span>
              </div>
              <ul className="space-y-1.5 text-sm text-slate-700">
                {exercise.avoidMistakes.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Encouraging Tip */}
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4">
            {exercise.encouragementTip}
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 sm:px-6 py-3.5 sm:py-4 pb-[max(0.875rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 bg-slate-50/90 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium cursor-pointer"
          >
            סגירה
          </button>

          <button
            type="button"
            disabled={isLocked}
            onClick={() => {
              onMarkComplete(exercise.id);
              onClose();
            }}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
              isLocked
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{isCompletedToday ? 'הושלם היום — סגור' : 'סיים וסמן כבוצע'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
