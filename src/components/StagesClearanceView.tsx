import { useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Lock,
  Stethoscope,
  X,
} from 'lucide-react';
import { EXERCISES, REHAB_STAGES } from '../data/rehabProtocol';
import type {
  PatientProfile,
  RehabStage,
  RehabStageId,
  StageClearanceRecord,
} from '../types/rehab';
import { canUnlockStage } from '../utils/rehabEngine';
import { getTodayDateStr } from '../utils/storage';
import { KneeAngleDiagram } from './KneeAngleDiagram';
import { SafeImage } from './SafeImage';

interface StagesClearanceViewProps {
  profile: PatientProfile;
  activeStageId: RehabStageId;
  clearances: Record<RehabStageId, StageClearanceRecord>;
  onSelectActiveStage: (stageId: RehabStageId) => void;
  onUpdateClearance: (
    stageId: RehabStageId,
    updates: Partial<StageClearanceRecord>,
    newAllowedAngle?: number
  ) => void;
}

export function StagesClearanceView({
  profile,
  activeStageId,
  clearances,
  onSelectActiveStage,
  onUpdateClearance,
}: StagesClearanceViewProps) {
  const [modalStage, setModalStage] = useState<RehabStage | null>(null);
  const [clinicianName, setClinicianName] = useState('');
  const [clinicianRole, setClinicianRole] = useState<'orthopedist' | 'physiotherapist'>('orthopedist');
  const [clearedDate, setClearedDate] = useState(getTodayDateStr());
  const [clinicianNotes, setClinicianNotes] = useState('');
  const [approvedAngle, setApprovedAngle] = useState<number>(profile.allowedBraceFlexionDeg);
  const [questionsDraft, setQuestionsDraft] = useState('');
  const [checkedCriteria, setCheckedCriteria] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  const openConsultationModal = (stage: RehabStage) => {
    const existing = clearances[stage.id];
    setModalStage(stage);
    setClinicianName(existing?.clinicianName ?? '');
    setClinicianRole(existing?.clinicianRole ?? 'orthopedist');
    setClearedDate(existing?.clearedDate ?? getTodayDateStr());
    setClinicianNotes(existing?.notes ?? '');
    setQuestionsDraft(existing?.patientQuestions ?? '');
    setCheckedCriteria(existing?.checkedCriteriaIds ?? []);
    const suggestedMinAngle =
      stage.id === 1 ? 0 : stage.id === 2 ? Math.max(profile.allowedBraceFlexionDeg, 30) : stage.id === 3 ? Math.max(profile.allowedBraceFlexionDeg, 90) : 120;
    setApprovedAngle(suggestedMinAngle);
    setFormError('');
  };

  const handleToggleCriterion = (id: string) => {
    setCheckedCriteria((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSavePrepOnly = () => {
    if (!modalStage) return;
    onUpdateClearance(modalStage.id, {
      checkedCriteriaIds: checkedCriteria,
      patientQuestions: questionsDraft,
    });
    setModalStage(null);
  };

  const handleApproveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalStage) return;
    if (!clinicianName.trim()) {
      setFormError('יש להזין את שם הרופא המנתח או הפיזיותרפיסט שאישר את תחילת השלב.');
      return;
    }

    onUpdateClearance(
      modalStage.id,
      {
        status: 'cleared',
        clinicianName: clinicianName.trim(),
        clinicianRole,
        clearedDate,
        notes: clinicianNotes.trim(),
        checkedCriteriaIds: checkedCriteria,
        patientQuestions: questionsDraft,
      },
      approvedAngle
    );
    onSelectActiveStage(modalStage.id);
    setModalStage(null);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          תוכנית השלבים ושערי אישור רפואי
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-[70ch]">
          שיקום שבר בפיקת הברך מתבצע בהדרגה מדויקת כדי להגן על איחוי העצם והגיד. לפני המעבר לכל שלב חדש, הכינו את רשימת השאלות ותעדו את אישור הרופא או הפיזיותרפיסט.
        </p>
      </div>

      <div className="space-y-5">
        {REHAB_STAGES.map((stage) => {
          const record = clearances[stage.id];
          const unlockInfo = canUnlockStage(stage.id, clearances);
          const isCleared = record?.status === 'cleared';
          const isActive = activeStageId === stage.id;
          const isLocked = !unlockInfo.allowed;

          return (
            <section
              key={stage.id}
              className={`bg-white border rounded-2xl p-6 space-y-5 transition-colors ${
                isActive ? 'border-teal-600' : 'border-slate-200'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium text-slate-500">{stage.timeframeLabel}</span>
                    <span aria-hidden="true">·</span>
                    {isCleared ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-teal-800">
                        <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        <span>מאושר לתרגול</span>
                      </span>
                    ) : isLocked ? (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                        <Lock className="w-4 h-4" aria-hidden="true" />
                        <span>ממתין להשלמת שלב קודם</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>ממתין להתייעצות ואישור רפואי</span>
                      </span>
                    )}
                    {isActive && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-teal-800">השלב הפעיל שלך כעת</span>
                      </>
                    )}
                  </div>

                  <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                    {stage.title}
                  </h2>
                  <p className="text-sm text-slate-600 max-w-[70ch]">{stage.summary}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {isCleared && !isActive && (
                    <button
                      type="button"
                      onClick={() => onSelectActiveStage(stage.id)}
                      className="px-4 py-2.5 min-h-[44px] rounded-xl border border-teal-700 text-teal-800 hover:bg-teal-50 text-sm font-semibold whitespace-nowrap cursor-pointer"
                    >
                      הפעל שלב זה
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => openConsultationModal(stage)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                      isLocked
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isCleared
                          ? 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 cursor-pointer'
                          : 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" aria-hidden="true" />
                    <span>{isCleared ? 'פרטי אישור והכנה' : 'התייעצות ואישור שלב'}</span>
                  </button>
                </div>
              </div>

              {/* Protocol Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-sm">
                <div>
                  <p className="text-xs font-medium text-slate-500">יעד קליני</p>
                  <p className="mt-1 text-slate-800">{stage.clinicalGoal}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">פרוטוקול סד</p>
                  <p className="mt-1 text-slate-800">{stage.braceProtocol}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">נשיאת משקל</p>
                  <p className="mt-1 text-slate-800">{stage.weightBearingProtocol}</p>
                </div>
              </div>

              {/* Visual Target Angle & Exercise Previews */}
              <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center gap-5">
                <KneeAngleDiagram
                  angleDeg={
                    stage.id === 1 ? 0 : stage.id === 2 ? 90 : stage.id === 3 ? 120 : 135
                  }
                  maxAllowedDeg={
                    stage.id === 1 ? 0 : stage.id === 2 ? 90 : stage.id === 3 ? 120 : 140
                  }
                  size="sm"
                  caption={
                    stage.id === 1
                      ? 'יעד שלב 1: יישור 0°'
                      : stage.id === 2
                        ? 'יעד שלב 2: כיפוף עד 90°'
                        : stage.id === 3
                          ? 'יעד שלב 3: 110°–125°'
                          : 'יעד שלב 4: טווח מלא 130°+'
                  }
                  className="self-start md:self-center shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    דוגמאות לתרגילים בשלב {stage.id}:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {EXERCISES.filter((ex) => ex.stageId === stage.id)
                      .slice(0, 3)
                      .map((ex) => (
                        <div key={ex.id} className="space-y-1.5 min-w-0">
                          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                            <SafeImage
                              src={ex.imageUrl}
                              alt={ex.imageAlt}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2">
                            {ex.title}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Questions & Clinician Info */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="font-semibold text-slate-900 mb-2">
                    שאלות מומלצות להתייעצות לפני תחילת השלב:
                  </p>
                  <ul className="space-y-1.5 text-slate-600">
                    {stage.consultationQuestions.map((q, idx) => (
                      <li key={idx}>• {q}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-slate-900 mb-2">קריטריוני מוכנות ואישור:</p>
                  <ul className="space-y-1.5 text-slate-600">
                    {stage.readinessCriteria.map((c) => {
                      const checked = record?.checkedCriteriaIds.includes(c.id);
                      return (
                        <li key={c.id} className="flex items-start gap-2">
                          <ClipboardCheck
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              checked ? 'text-teal-700' : 'text-slate-400'
                            }`}
                            aria-hidden="true"
                          />
                          <span className={checked ? 'text-slate-900' : 'text-slate-600'}>
                            {c.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  {isCleared && record?.clinicianName && (
                    <p className="mt-3 text-xs sm:text-sm text-teal-800 font-medium">
                      אושר ע&quot;י {record.clinicianName} בתאריך {record.clearedDate}
                      {record.notes ? ` · ${record.notes}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Consultation & Clearance Modal */}
      {modalStage && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clearance-modal-title"
        >
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92dvh] flex flex-col overflow-hidden shadow-xl">
            <div className="sm:hidden w-10 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 shrink-0" aria-hidden="true" />
            <div className="bg-white/95 backdrop-blur-md border-b border-slate-200 px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <h2 id="clearance-modal-title" className="font-display text-base sm:text-lg font-bold text-slate-900 truncate">
                  התייעצות ואישור רפואי — שלב {modalStage.id}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">{modalStage.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setModalStage(null)}
                aria-label="סגור חלון התייעצות"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleApproveStage} className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* Readiness Checklist */}
              <div className="space-y-3">
                <p className="font-semibold text-sm text-slate-900">
                  1. בדיקת קריטריונים למוכנות (לשיחה עם הצוות המטפל):
                </p>
                <div className="space-y-2">
                  {modalStage.readinessCriteria.map((criterion) => (
                    <label
                      key={criterion.id}
                      className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checkedCriteria.includes(criterion.id)}
                        onChange={() => handleToggleCriterion(criterion.id)}
                        className="mt-1 w-4 h-4 accent-teal-700"
                      />
                      <span className="text-sm text-slate-800">{criterion.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Patient Questions */}
              <div className="space-y-2">
                <label htmlFor="patient-questions" className="block font-semibold text-sm text-slate-900">
                  2. השאלות שלי לרופא או לפיזיותרפיסט:
                </label>
                <textarea
                  id="patient-questions"
                  rows={3}
                  value={questionsDraft}
                  onChange={(e) => setQuestionsDraft(e.target.value)}
                  placeholder="כתבו כאן שאלות לביקור הקרוב (לדוגמה: האם מותר להסיר את הסד במקלחת?)"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-600"
                />
              </div>

              {/* Clinician Approval Section */}
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <p className="font-semibold text-sm text-slate-900">
                  3. תיעוד אישור רפואי לאחר ההתייעצות:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="clinician-name" className="block text-xs font-medium text-slate-700 mb-1">
                      שם הרופא / הפיזיותרפיסט המאשר *
                    </label>
                    <input
                      id="clinician-name"
                      type="text"
                      value={clinicianName}
                      onChange={(e) => {
                        setClinicianName(e.target.value);
                        setFormError('');
                      }}
                      placeholder='למשל: ד"ר אורי מזרחי'
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="clinician-role" className="block text-xs font-medium text-slate-700 mb-1">
                      תפקיד מטפל
                    </label>
                    <select
                      id="clinician-role"
                      value={clinicianRole}
                      onChange={(e) =>
                        setClinicianRole(e.target.value as 'orthopedist' | 'physiotherapist')
                      }
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white"
                    >
                      <option value="orthopedist">אורטופד / מנתח</option>
                      <option value="physiotherapist">פיזיותרפיסט/ית</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="cleared-date" className="block text-xs font-medium text-slate-700 mb-1">
                      תאריך האישור
                    </label>
                    <input
                      id="cleared-date"
                      type="date"
                      value={clearedDate}
                      onChange={(e) => setClearedDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 tabular-nums"
                    />
                  </div>

                  <div>
                    <label htmlFor="approved-angle" className="block text-xs font-medium text-slate-700 mb-1">
                      זווית כיפוף מאושרת בסד מעתה
                    </label>
                    <select
                      id="approved-angle"
                      value={approvedAngle}
                      onChange={(e) => setApprovedAngle(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white tabular-nums"
                    >
                      <option value={0}>0° (נעול ביישור)</option>
                      <option value={30}>עד 30°</option>
                      <option value={60}>עד 60°</option>
                      <option value={90}>עד 90°</option>
                      <option value={120}>עד 120°</option>
                      <option value={140}>ללא הגבלת סד (140°)</option>
                    </select>
                    <div className="mt-2.5">
                      <KneeAngleDiagram
                        angleDeg={approvedAngle}
                        maxAllowedDeg={approvedAngle}
                        size="sm"
                        caption={`המחשה: טווח מאושר 0°–${approvedAngle}°`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="clinician-notes" className="block text-xs font-medium text-slate-700 mb-1">
                    דגשים מיוחדים מההתייעצות
                  </label>
                  <input
                    id="clinician-notes"
                    type="text"
                    value={clinicianNotes}
                    onChange={(e) => setClinicianNotes(e.target.value)}
                    placeholder="למשל: מותר להתחיל החלקות עקב עד 60° ללא כאב חד"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900"
                  />
                </div>

                {formError && (
                  <p role="alert" className="text-sm font-medium text-red-700">
                    {formError}
                  </p>
                )}
              </div>

              <div className="pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSavePrepOnly}
                  className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium cursor-pointer"
                >
                  שמור הכנה לביקור בלבד
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>אשר ופתח שלב {modalStage.id} לתרגול</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
