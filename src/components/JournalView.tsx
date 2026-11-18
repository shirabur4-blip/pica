import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Printer,
  Trash2,
} from 'lucide-react';
import { SWELLING_LABELS, SYMPTOM_CONTEXT_LABELS } from '../data/rehabProtocol';
import type {
  DailyLogEntry,
  PatientProfile,
  RehabStage,
  RehabStageId,
  StageClearanceRecord,
  SwellingLevel,
  SymptomContext,
} from '../types/rehab';
import { buildMedicalTeamSummary, evaluatePainSafety } from '../utils/rehabEngine';
import { getTodayDateStr } from '../utils/storage';
import { KneeAngleDiagram } from './KneeAngleDiagram';

interface JournalViewProps {
  profile: PatientProfile;
  activeStage: RehabStage;
  clearances: Record<RehabStageId, StageClearanceRecord>;
  logs: DailyLogEntry[];
  onSaveLog: (entry: Omit<DailyLogEntry, 'id' | 'createdAt'>) => void;
  onDeleteLog: (id: string) => void;
}

type RangeFilter = '7' | '14' | 'all';

export function JournalView({
  profile,
  activeStage,
  clearances,
  logs,
  onSaveLog,
  onDeleteLog,
}: JournalViewProps) {
  const [date, setDate] = useState(getTodayDateStr());
  const [painLevel, setPainLevel] = useState(3);
  const [stiffnessLevel, setStiffnessLevel] = useState(4);
  const [swellingLevel, setSwellingLevel] = useState<SwellingLevel>('mild');
  const [flexionDegrees, setFlexionDegrees] = useState<string>(
    String(profile.allowedBraceFlexionDeg > 0 ? profile.allowedBraceFlexionDeg : 25)
  );
  const [extensionZeroAchieved, setExtensionZeroAchieved] = useState(true);
  const [context, setContext] = useState<SymptomContext>('morning');
  const [notes, setNotes] = useState('');
  const [savedNotice, setSavedNotice] = useState('');

  // Chart state
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('14');
  const [showPainLine, setShowPainLine] = useState(true);
  const [showStiffnessLine, setShowStiffnessLine] = useState(true);
  const [showSwellingLine, setShowSwellingLine] = useState(true);
  const [showFlexionLine, setShowFlexionLine] = useState(true);
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  // Medical summary copy state
  const [copiedSummary, setCopiedSummary] = useState(false);

  const safetyEval = useMemo(
    () => evaluatePainSafety(painLevel, swellingLevel),
    [painLevel, swellingLevel]
  );

  const sortedLogsDesc = useMemo(
    () => [...logs].sort((a, b) => b.date.localeCompare(a.date)),
    [logs]
  );

  const chartLogs = useMemo(() => {
    const asc = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    if (rangeFilter === '7') return asc.slice(-7);
    if (rangeFilter === '14') return asc.slice(-14);
    return asc;
  }, [logs, rangeFilter]);

  const medicalSummary = useMemo(
    () => buildMedicalTeamSummary(profile, activeStage, logs, clearances),
    [profile, activeStage, logs, clearances]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFlexion =
      flexionDegrees.trim() === ''
        ? null
        : Math.max(0, Math.min(145, Number(flexionDegrees)));

    onSaveLog({
      date,
      painLevel,
      stiffnessLevel,
      swellingLevel,
      flexionDegrees: Number.isNaN(parsedFlexion as number) ? null : parsedFlexion,
      extensionZeroAchieved,
      context,
      notes: notes.trim(),
    });
    setNotes('');
    setSavedNotice('הדיווח היומי נשמר בהצלחה ועודכן בגרף ובסיכום לצוות הרפואי.');
    window.setTimeout(() => setSavedNotice(''), 4000);
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(medicalSummary.formattedReportText);
      setCopiedSummary(true);
      window.setTimeout(() => setCopiedSummary(false), 3000);
    } catch {
      setCopiedSummary(true);
      window.setTimeout(() => setCopiedSummary(false), 3000);
    }
  };

  // SVG chart dimensions (balanced proportions for both mobile and desktop without forced scroll)
  const chartW = 480;
  const chartH = 220;
  const padL = 32;
  const padR = 38;
  const padT = 18;
  const padB = 32;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const getX = (idx: number, total: number) => {
    if (total <= 1) return padL + innerW / 2;
    return padL + (idx / (total - 1)) * innerW;
  };
  const getY = (val1To10: number) => {
    const clamped = Math.max(0, Math.min(10, val1To10));
    return padT + innerH - (clamped / 10) * innerH;
  };
  const getFlexionY = (deg: number) => {
    const clamped = Math.max(0, Math.min(140, deg));
    return padT + innerH - (clamped / 140) * innerH;
  };

  const buildPath = (getter: (entry: DailyLogEntry) => number) => {
    if (chartLogs.length === 0) return '';
    return chartLogs
      .map((entry, idx) => {
        const x = getX(idx, chartLogs.length);
        const y = getY(getter(entry));
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const buildFlexionPath = () => {
    const valid = chartLogs
      .map((entry, idx) => ({ entry, idx }))
      .filter((item) => item.entry.flexionDegrees !== null);
    if (valid.length <= 1) return '';
    return valid
      .map((item, i) => {
        const x = getX(item.idx, chartLogs.length);
        const y = getFlexionY(item.entry.flexionDegrees ?? 0);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const activePoint =
    selectedPointIndex !== null && chartLogs[selectedPointIndex]
      ? chartLogs[selectedPointIndex]
      : chartLogs[chartLogs.length - 1] ?? null;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          יומן כאב ומעקב תסמינים יומי
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-[70ch]">
          תעדו מדי יום את רמת הכאב (1–10), הנוקשות והנפיחות בברך. הנתונים מתרכזים לגרף מגמה ברור ולסיכום מוכן לצוות הרפואי לפני כל ביקורת.
        </p>
      </div>

      {/* Top Grid: Daily Logger + Live Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Daily Log Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-slate-900">רישום תסמינים ליום</h2>
            <input
              type="date"
              aria-label="תאריך הדיווח"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm text-slate-800 tabular-nums"
            />
          </div>

          {/* Pain Scale 1-10 */}
          <fieldset className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <legend className="font-semibold text-slate-900">רמת כאב (סולם 1–10)</legend>
              <span className="font-mono font-semibold text-teal-800 tabular-nums">
                {painLevel} / 10
              </span>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const selected = painLevel === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPainLevel(num)}
                    aria-pressed={selected}
                    aria-label={`כאב רמה ${num}`}
                    className={`min-h-[44px] rounded-lg font-mono text-sm font-semibold tabular-nums border transition-colors cursor-pointer ${
                      selected
                        ? num >= 7
                          ? 'bg-red-700 border-red-700 text-white'
                          : num >= 5
                            ? 'bg-amber-600 border-amber-600 text-white'
                            : 'bg-teal-700 border-teal-700 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>1 · כאב מינימלי</span>
              <span>5 · בינוני</span>
              <span>10 · כאב עז</span>
            </div>
          </fieldset>

          {/* Stiffness Scale 1-10 */}
          <fieldset className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <legend className="font-semibold text-slate-900">רמת נוקשות בברך (1–10)</legend>
              <span className="font-mono font-semibold text-slate-800 tabular-nums">
                {stiffnessLevel} / 10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={stiffnessLevel}
              onChange={(e) => setStiffnessLevel(Number(e.target.value))}
              aria-label="רמת נוקשות בברך מ-1 עד 10"
              className="w-full accent-slate-700 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>1 · תנועה חופשית</span>
              <span>5 · נוקשות בינונית</span>
              <span>10 · נוקשות קשה</span>
            </div>
          </fieldset>

          {/* Swelling Selector */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-slate-900">רמת נפיחות</legend>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SWELLING_LABELS) as SwellingLevel[]).map((key) => {
                const info = SWELLING_LABELS[key];
                const selected = swellingLevel === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSwellingLevel(key)}
                    aria-pressed={selected}
                    className={`p-2.5 min-h-[44px] rounded-xl border text-right text-xs sm:text-sm transition-colors cursor-pointer ${
                      selected
                        ? 'bg-teal-50 border-teal-600 text-teal-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {info.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* ROM & Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="flexion-input" className="block text-xs font-medium text-slate-700 mb-1">
                טווח כיפוף (מעלות °)
              </label>
              <input
                id="flexion-input"
                type="number"
                min={0}
                max={145}
                value={flexionDegrees}
                onChange={(e) => setFlexionDegrees(e.target.value)}
                placeholder="למשל: 45"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px] text-sm text-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="context-select" className="block text-xs font-medium text-slate-700 mb-1">
                מועד / הקשר הדיווח
              </label>
              <select
                id="context-select"
                value={context}
                onChange={(e) => setContext(e.target.value as SymptomContext)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[44px] text-sm text-slate-900 bg-white"
              >
                {(Object.keys(SYMPTOM_CONTEXT_LABELS) as SymptomContext[]).map((k) => (
                  <option key={k} value={k}>
                    {SYMPTOM_CONTEXT_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
            <div className="space-y-1 text-xs sm:text-sm">
              <p className="font-semibold text-slate-900">המחשת זווית הכיפוף שנמדדה</p>
              <p className="text-slate-600 leading-relaxed tabular-nums">
                הזווית המוצגת ({flexionDegrees.trim() === '' ? '0' : flexionDegrees}°) לעומת גבול הסד המאושר ({profile.allowedBraceFlexionDeg}°).
              </p>
            </div>
            <KneeAngleDiagram
              angleDeg={Number(flexionDegrees) || 0}
              maxAllowedDeg={profile.allowedBraceFlexionDeg}
              size="sm"
              className="shrink-0"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={extensionZeroAchieved}
              onChange={(e) => setExtensionZeroAchieved(e.target.checked)}
              className="w-4 h-4 accent-teal-700"
            />
            <span>הצלחתי להגיע ליישור ברך מלא (0°) היום</span>
          </label>

          <div>
            <label htmlFor="symptom-notes" className="block text-xs font-medium text-slate-700 mb-1">
              הערות (מה הקל או החמיר, תחושת יציבות)
            </label>
            <textarea
              id="symptom-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="לדוגמה: הקירור אחרי התרגול עזר מאוד לנפיחות"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          {/* Real-time Safety Evaluation Feedback */}
          <div
            role="status"
            className={`rounded-xl p-3.5 border text-xs sm:text-sm flex items-start gap-2.5 ${
              safetyEval.level === 'stop_consult'
                ? 'bg-red-50 border-red-200 text-red-900'
                : safetyEval.level === 'caution'
                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                  : 'bg-teal-50/70 border-teal-200 text-teal-950'
            }`}
          >
            {safetyEval.level === 'safe' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  safetyEval.level === 'stop_consult' ? 'text-red-700' : 'text-amber-700'
                }`}
                aria-hidden="true"
              />
            )}
            <div>
              <p className="font-semibold">{safetyEval.title}</p>
              <p className="mt-0.5 leading-relaxed">{safetyEval.guidance}</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 min-h-[44px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            שמור דיווח יומי ביומן
          </button>

          {savedNotice && (
            <p role="status" className="text-sm font-medium text-teal-800 text-center">
              {savedNotice}
            </p>
          )}
        </form>

        {/* Chart + Medical Team Summary Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Multi-Metric Trend Chart */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  מגמת כאב, נוקשות, נפיחות וטווח כיפוף
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  לחצו על נקודה בגרף לצפייה בפירוט היומי
                </p>
              </div>

              {/* Segmented Time-Range Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {(
                  [
                    { id: '7', label: '7 ימים' },
                    { id: '14', label: '14 ימים' },
                    { id: 'all', label: 'הכל' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRangeFilter(opt.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                      rangeFilter === opt.id
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Series Toggles */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPainLine}
                  onChange={(e) => setShowPainLine(e.target.checked)}
                  className="w-4 h-4 accent-teal-700"
                />
                <span className="inline-block w-3 h-0.5 bg-teal-700" aria-hidden="true" />
                <span className="text-slate-800 font-medium">כאב (1–10)</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStiffnessLine}
                  onChange={(e) => setShowStiffnessLine(e.target.checked)}
                  className="w-4 h-4 accent-slate-700"
                />
                <span className="inline-block w-3 h-0.5 bg-slate-600" aria-hidden="true" />
                <span className="text-slate-800 font-medium">נוקשות (1–10)</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSwellingLine}
                  onChange={(e) => setShowSwellingLine(e.target.checked)}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="inline-block w-3 h-0.5 bg-amber-600" aria-hidden="true" />
                <span className="text-slate-800 font-medium">נפיחות (מדד 1–9)</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFlexionLine}
                  onChange={(e) => setShowFlexionLine(e.target.checked)}
                  className="w-4 h-4 accent-sky-700"
                />
                <span className="inline-block w-3 h-0.5 bg-sky-700" aria-hidden="true" />
                <span className="text-slate-800 font-medium">טווח כיפוף (0°–140°)</span>
              </label>
            </div>

            {chartLogs.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-600">אין עדיין דיווחים להצגה בגרף.</p>
                <p className="text-xs text-slate-500 mt-1">הוסיפו את הדיווח הראשון שלכם בטופס הסמוך.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-full" dir="ltr">
                  <svg
                    viewBox={`0 0 ${chartW} ${chartH}`}
                    className="w-full h-auto"
                    role="img"
                    aria-label="גרף שינויי כאב, נוקשות, נפיחות וטווח כיפוף לאורך זמן"
                  >
                    {/* Horizontal gridlines */}
                    {[0, 2, 4, 6, 8, 10].map((tick) => {
                      const y = getY(tick);
                      const romTick = Math.round((tick / 10) * 140);
                      return (
                        <g key={tick}>
                          <line
                            x1={padL}
                            y1={y}
                            x2={chartW - padR}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                          />
                          <text
                            x={padL - 8}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="11"
                            fill="#64748b"
                            fontFamily="IBM Plex Mono, monospace"
                          >
                            {tick}
                          </text>
                          {showFlexionLine && (
                            <text
                              x={chartW - padR + 8}
                              y={y + 4}
                              textAnchor="start"
                              fontSize="10"
                              fill="#0369a1"
                              fontFamily="IBM Plex Mono, monospace"
                            >
                              {romTick}°
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Flexion ROM line */}
                    {showFlexionLine && buildFlexionPath() && (
                      <path
                        d={buildFlexionPath()}
                        fill="none"
                        stroke="#0369a1"
                        strokeWidth="2.2"
                        strokeDasharray="6 3"
                      />
                    )}

                    {/* Swelling line */}
                    {showSwellingLine && chartLogs.length > 1 && (
                      <path
                        d={buildPath((e) => SWELLING_LABELS[e.swellingLevel].score)}
                        fill="none"
                        stroke="#d97706"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Stiffness line */}
                    {showStiffnessLine && chartLogs.length > 1 && (
                      <path
                        d={buildPath((e) => e.stiffnessLevel)}
                        fill="none"
                        stroke="#475569"
                        strokeWidth="2.2"
                      />
                    )}

                    {/* Pain line */}
                    {showPainLine && chartLogs.length > 1 && (
                      <path
                        d={buildPath((e) => e.painLevel)}
                        fill="none"
                        stroke="#0f766e"
                        strokeWidth="2.8"
                      />
                    )}

                    {/* Points and X-axis date labels */}
                    {chartLogs.map((entry, idx) => {
                      const x = getX(idx, chartLogs.length);
                      const yPain = getY(entry.painLevel);
                      const yStiff = getY(entry.stiffnessLevel);
                      const ySwell = getY(SWELLING_LABELS[entry.swellingLevel].score);
                      const isSelected = activePoint?.id === entry.id;

                      return (
                        <g
                          key={entry.id}
                          onClick={() => setSelectedPointIndex(idx)}
                          className="cursor-pointer"
                        >
                          <line
                            x1={x}
                            y1={padT}
                            x2={x}
                            y2={chartH - padB}
                            stroke={isSelected ? '#94a3b8' : 'transparent'}
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />

                          {showFlexionLine && entry.flexionDegrees !== null && (
                            <circle
                              cx={x}
                              cy={getFlexionY(entry.flexionDegrees)}
                              r={isSelected ? 5 : 3.5}
                              fill="#0369a1"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          )}
                          {showSwellingLine && (
                            <circle
                              cx={x}
                              cy={ySwell}
                              r={isSelected ? 5 : 3.5}
                              fill="#d97706"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          )}
                          {showStiffnessLine && (
                            <circle
                              cx={x}
                              cy={yStiff}
                              r={isSelected ? 5 : 3.5}
                              fill="#475569"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          )}
                          {showPainLine && (
                            <circle
                              cx={x}
                              cy={yPain}
                              r={isSelected ? 6 : 4.5}
                              fill="#0f766e"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          )}

                          <text
                            x={x}
                            y={chartH - 10}
                            textAnchor="middle"
                            fontSize="10"
                            fill={isSelected ? '#0f172a' : '#64748b'}
                            fontFamily="IBM Plex Mono, monospace"
                          >
                            {entry.date.slice(5)}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {activePoint && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {activePoint.date}
                    </span>
                    <div className="flex flex-wrap items-center gap-3 text-slate-700 tabular-nums">
                      <span>כאב: <strong className="text-teal-800">{activePoint.painLevel}/10</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>נוקשות: <strong>{activePoint.stiffnessLevel}/10</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>{SWELLING_LABELS[activePoint.swellingLevel].label}</span>
                      {activePoint.flexionDegrees !== null && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>כיפוף: <strong>{activePoint.flexionDegrees}°</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Medical Team Summary */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  סיכום לצוות הרפואי
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  תמונת מצב מרוכזת לביקורת אצל האורטופד או הפיזיותרפיסט
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer"
                >
                  {copiedSummary ? (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>הסיכום הועתק</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" aria-hidden="true" />
                      <span>העתק סיכום לצוות</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-4 h-4" aria-hidden="true" />
                  <span>הדפס</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-3 border-y border-slate-100 text-sm">
              <div>
                <p className="text-xs text-slate-500">ממוצע כאב (7 ימים)</p>
                <p className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {medicalSummary.avgPain7Days ?? '—'}/10
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">ממוצע נוקשות</p>
                <p className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {medicalSummary.avgStiffness7Days ?? '—'}/10
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">ימי נפיחות בינונית+</p>
                <p className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {medicalSummary.moderateOrSevereSwellingDays}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">שיא כיפוף מתועד</p>
                <p className="mt-1 font-mono text-lg font-semibold text-slate-900 tabular-nums">
                  {medicalSummary.maxFlexionDeg !== null ? `${medicalSummary.maxFlexionDeg}°` : '—'}
                </p>
              </div>
            </div>

            <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
              {medicalSummary.formattedReportText}
            </pre>
          </section>
        </div>
      </div>

      {/* History Log Table */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">היסטוריית דיווחים</h2>
          <span className="text-xs text-slate-500 tabular-nums">{sortedLogsDesc.length} רשומות</span>
        </div>

        {sortedLogsDesc.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            עדיין לא נרשמו דיווחים. התחילו לתעד את מדדי הכאב והתסמינים היומיים למעלה.
          </div>
        ) : (
          <>
            {/* Mobile Card List (thumb-friendly, zero horizontal table scroll) */}
            <div className="md:hidden divide-y divide-slate-200">
              {sortedLogsDesc.map((entry) => (
                <div key={entry.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {entry.date}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500">
                        {SYMPTOM_CONTEXT_LABELS[entry.context]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteLog(entry.id)}
                      aria-label={`מחק דיווח מתאריך ${entry.date}`}
                      className="min-w-[44px] min-h-[44px] -ml-2 inline-flex items-center justify-center rounded-xl text-slate-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm tabular-nums">
                    <div>
                      <span className="text-slate-500">כאב: </span>
                      <strong
                        className={
                          entry.painLevel >= 7
                            ? 'text-red-700'
                            : entry.painLevel >= 5
                              ? 'text-amber-700'
                              : 'text-teal-800'
                        }
                      >
                        {entry.painLevel}/10
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">נוקשות: </span>
                      <strong className="text-slate-900">{entry.stiffnessLevel}/10</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">נפיחות: </span>
                      <span className="text-slate-800">{SWELLING_LABELS[entry.swellingLevel].label}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">כיפוף: </span>
                      <strong className="text-slate-900">
                        {entry.flexionDegrees !== null ? `${entry.flexionDegrees}°` : '—'}
                      </strong>
                    </div>
                  </div>

                  {entry.notes ? (
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pt-1">
                      {entry.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-medium">תאריך</th>
                    <th className="py-3 px-4 font-medium">כאב (1–10)</th>
                    <th className="py-3 px-4 font-medium">נוקשות (1–10)</th>
                    <th className="py-3 px-4 font-medium">נפיחות</th>
                    <th className="py-3 px-4 font-medium">טווח כיפוף</th>
                    <th className="py-3 px-4 font-medium">הקשר והערות</th>
                    <th className="py-3 px-4 font-medium">פעולה</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedLogsDesc.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono text-xs sm:text-sm text-slate-900 tabular-nums whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold tabular-nums whitespace-nowrap">
                        <span
                          className={
                            entry.painLevel >= 7
                              ? 'text-red-700'
                              : entry.painLevel >= 5
                                ? 'text-amber-700'
                                : 'text-teal-800'
                          }
                        >
                          {entry.painLevel}/10
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                        {entry.stiffnessLevel}/10
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {SWELLING_LABELS[entry.swellingLevel].label}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-800 tabular-nums whitespace-nowrap">
                        {entry.flexionDegrees !== null ? `${entry.flexionDegrees}°` : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs">
                        <span className="text-xs text-slate-500">
                          {SYMPTOM_CONTEXT_LABELS[entry.context]}
                        </span>
                        {entry.notes ? <p className="text-slate-800 mt-0.5">{entry.notes}</p> : null}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onDeleteLog(entry.id)}
                          aria-label={`מחק דיווח מתאריך ${entry.date}`}
                          className="min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
