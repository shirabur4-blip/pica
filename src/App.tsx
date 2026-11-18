import { useEffect, useMemo, useState } from 'react';
import { ExerciseModal } from './components/ExerciseModal';
import { JournalView } from './components/JournalView';
import { SafetyProfileView } from './components/SafetyProfileView';
import { StagesClearanceView } from './components/StagesClearanceView';
import { TodayWorkspace } from './components/TodayWorkspace';
import { TopBar, type AppTab } from './components/TopBar';
import { EXERCISES } from './data/rehabProtocol';
import type {
  DailyLogEntry,
  PatientProfile,
  PersonalizedExercise,
  RehabStageId,
  StageClearanceRecord,
} from './types/rehab';
import {
  calculateCurrentWeek,
  calculateDaysPostOp,
  computeDashboardMetrics,
  getStageById,
  personalizeExercise,
} from './utils/rehabEngine';
import {
  createInitialState,
  getTodayDateStr,
  loadAppState,
  saveAppState,
  type RehabAppState,
} from './utils/storage';

export default function App() {
  const [state, setState] = useState<RehabAppState>(() => loadAppState());
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (
        tabParam === 'today' ||
        tabParam === 'stages' ||
        tabParam === 'journal' ||
        tabParam === 'safety'
      ) {
        return tabParam;
      }
    }
    return 'today';
  });
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('a11y-large-text', state.profile.largeTextMode);
    }
  }, [state.profile.largeTextMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeTab]);

  const todayStr = getTodayDateStr();
  const daysPostOp = useMemo(
    () => calculateDaysPostOp(state.profile.surgeryDate, todayStr),
    [state.profile.surgeryDate, todayStr]
  );
  const currentWeek = useMemo(() => calculateCurrentWeek(daysPostOp), [daysPostOp]);
  const activeStage = useMemo(() => getStageById(state.activeStageId), [state.activeStageId]);
  const activeClearance = state.clearances[state.activeStageId];

  const stageExercises = useMemo(() => {
    return EXERCISES.filter((ex) => ex.stageId === state.activeStageId).map((ex) =>
      personalizeExercise(ex, state.profile)
    );
  }, [state.activeStageId, state.profile]);

  const completedTodayIds = state.completedByDate[todayStr] ?? [];

  const safeExercisesToday = useMemo(
    () => stageExercises.filter((ex) => ex.isSafeForCurrentLimits),
    [stageExercises]
  );

  const metrics = useMemo(
    () => computeDashboardMetrics(state.logs, completedTodayIds, safeExercisesToday),
    [state.logs, completedTodayIds, safeExercisesToday]
  );

  const selectedExercise = useMemo(
    () => stageExercises.find((ex) => ex.id === selectedExerciseId) ?? null,
    [stageExercises, selectedExerciseId]
  );

  const handleToggleExerciseComplete = (exerciseId: string) => {
    setState((prev) => {
      const current = prev.completedByDate[todayStr] ?? [];
      const exists = current.includes(exerciseId);
      const updated = exists
        ? current.filter((id) => id !== exerciseId)
        : [...current, exerciseId];
      return {
        ...prev,
        completedByDate: {
          ...prev.completedByDate,
          [todayStr]: updated,
        },
      };
    });
  };

  const handleMarkExerciseComplete = (exerciseId: string) => {
    setState((prev) => {
      const current = prev.completedByDate[todayStr] ?? [];
      if (current.includes(exerciseId)) return prev;
      return {
        ...prev,
        completedByDate: {
          ...prev.completedByDate,
          [todayStr]: [...current, exerciseId],
        },
      };
    });
  };

  const handleUpdateClearance = (
    stageId: RehabStageId,
    updates: Partial<StageClearanceRecord>,
    newAllowedAngle?: number
  ) => {
    setState((prev) => {
      const existing = prev.clearances[stageId];
      const nextClearances: Record<RehabStageId, StageClearanceRecord> = {
        ...prev.clearances,
        [stageId]: {
          ...existing,
          ...updates,
        },
      };

      // If stageId was just cleared, ensure next stage transitions from 'locked' to 'pending_consultation'
      if (updates.status === 'cleared' && stageId < 4) {
        const nextId = (stageId + 1) as RehabStageId;
        if (nextClearances[nextId].status === 'locked') {
          nextClearances[nextId] = {
            ...nextClearances[nextId],
            status: 'pending_consultation',
          };
        }
      }

      const nextProfile: PatientProfile =
        typeof newAllowedAngle === 'number'
          ? {
              ...prev.profile,
              allowedBraceFlexionDeg: Math.max(
                prev.profile.allowedBraceFlexionDeg,
                newAllowedAngle
              ),
            }
          : prev.profile;

      return {
        ...prev,
        profile: nextProfile,
        clearances: nextClearances,
      };
    });
  };

  const handleSaveLog = (entry: Omit<DailyLogEntry, 'id' | 'createdAt'>) => {
    setState((prev) => {
      const existingForDate = prev.logs.find((l) => l.date === entry.date);
      const nextLog: DailyLogEntry = {
        ...entry,
        id: existingForDate ? existingForDate.id : `log_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      const filtered = prev.logs.filter((l) => l.date !== entry.date);
      return {
        ...prev,
        logs: [nextLog, ...filtered],
      };
    });
  };

  const handleDeleteLog = (id: string) => {
    setState((prev) => ({
      ...prev,
      logs: prev.logs.filter((l) => l.id !== id),
    }));
  };

  const handleUpdateProfile = (nextProfile: PatientProfile) => {
    setState((prev) => ({
      ...prev,
      profile: nextProfile,
    }));
  };

  const handleToggleLargeText = () => {
    setState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        largeTextMode: !prev.profile.largeTextMode,
      },
    }));
  };

  const handleResetDemoData = () => {
    const fresh = createInitialState();
    setState(fresh);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onQuickLogPain={() => setActiveTab('journal')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 lg:pb-12">
        {activeTab === 'today' && (
          <TodayWorkspace
            profile={state.profile}
            daysPostOp={daysPostOp}
            currentWeek={currentWeek}
            activeStage={activeStage}
            activeClearance={activeClearance}
            exercises={stageExercises}
            completedTodayIds={completedTodayIds}
            metrics={metrics}
            onToggleComplete={handleToggleExerciseComplete}
            onOpenExercise={(ex: PersonalizedExercise) => setSelectedExerciseId(ex.id)}
            onOpenStages={() => setActiveTab('stages')}
            onOpenSafety={() => setActiveTab('safety')}
            onOpenJournal={() => setActiveTab('journal')}
            onToggleLargeText={handleToggleLargeText}
          />
        )}

        {activeTab === 'stages' && (
          <StagesClearanceView
            profile={state.profile}
            activeStageId={state.activeStageId}
            clearances={state.clearances}
            onSelectActiveStage={(stageId) => {
              setState((prev) => ({ ...prev, activeStageId: stageId }));
              setActiveTab('today');
            }}
            onUpdateClearance={handleUpdateClearance}
          />
        )}

        {activeTab === 'journal' && (
          <JournalView
            profile={state.profile}
            activeStage={activeStage}
            clearances={state.clearances}
            logs={state.logs}
            onSaveLog={handleSaveLog}
            onDeleteLog={handleDeleteLog}
          />
        )}

        {activeTab === 'safety' && (
          <SafetyProfileView
            profile={state.profile}
            onUpdateProfile={handleUpdateProfile}
            onResetDemoData={handleResetDemoData}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mb-14 lg:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <p className="max-w-[75ch] leading-relaxed">
            צעד יציב — מערכת ליווי והדרכה לאחר ניתוח שבר בפיקת הברך. המידע והתרגילים אינם תחליף לייעוץ, אבחנה או הנחיה רפואית אישית של רופא אורטופד או פיזיותרפיסט.
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('safety')}
              className="hover:text-slate-900 underline underline-offset-4 cursor-pointer"
            >
              נורות אזהרה ובטיחות
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stages')}
              className="hover:text-slate-900 underline underline-offset-4 cursor-pointer"
            >
              אישורי שלבים
            </button>
          </div>
        </div>
      </footer>

      <ExerciseModal
        exercise={selectedExercise}
        isStageCleared={activeClearance.status === 'cleared'}
        isCompletedToday={
          selectedExercise ? completedTodayIds.includes(selectedExercise.id) : false
        }
        onClose={() => setSelectedExerciseId(null)}
        onMarkComplete={handleMarkExerciseComplete}
      />
    </div>
  );
}
