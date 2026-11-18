import { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, SlidersHorizontal, Type } from 'lucide-react';
import { RED_FLAGS, SAFETY_PRINCIPLES, WEIGHT_BEARING_LABELS } from '../data/rehabProtocol';
import type { OperatedSide, PacePreference, PatientProfile, WeightBearingLevel } from '../types/rehab';
import { KneeAngleDiagram } from './KneeAngleDiagram';
import { SafeImage } from './SafeImage';

interface SafetyProfileViewProps {
  profile: PatientProfile;
  onUpdateProfile: (nextProfile: PatientProfile) => void;
  onResetDemoData: () => void;
}

export function SafetyProfileView({
  profile,
  onUpdateProfile,
  onResetDemoData,
}: SafetyProfileViewProps) {
  const [formState, setFormState] = useState<PatientProfile>(profile);
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;
    onUpdateProfile({
      ...formState,
      name: formState.name.trim(),
    });
    setSavedMessage('ההגדרות והתוכנית האישית עודכנו בהצלחה.');
    window.setTimeout(() => setSavedMessage(''), 3500);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">
          דגשי בטיחות, נורות אזהרה והתאמה אישית
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-[70ch]">
          הבטיחות שלך קודמת לכל קצב התקדמות. התאימו כאן את ההנחיות הרפואיות שקיבלתם מהמנתח והכירו את הסימנים שבהם יש לעצור ולהתייעץ.
        </p>
      </div>

      {/* Red Flags Alert Section */}
      <section className="bg-red-50/70 border border-red-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-red-900">
          <ShieldAlert className="w-6 h-6 text-red-700 shrink-0" aria-hidden="true" />
          <h2 className="font-display text-lg sm:text-xl font-bold">
            נורות אזהרה — מתי לעצור תרגול ולפנות לבדיקה רפואית
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RED_FLAGS.map((flag) => (
            <div key={flag.id} className="bg-white border border-red-200 rounded-xl p-4 space-y-1.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0 mt-1" aria-hidden="true" />
                <h3 className="font-semibold text-sm sm:text-base text-slate-900">{flag.title}</h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600">{flag.detail}</p>
              <p className="text-xs sm:text-sm font-semibold text-red-800 pt-1">{flag.action}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Personalization Form */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2 text-slate-900">
            <SlidersHorizontal className="w-5 h-5 text-teal-700" aria-hidden="true" />
            <h2 className="font-display text-lg font-bold">התאמה אישית של תוכנית התרגילים</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="patient-name" className="block text-xs font-medium text-slate-700 mb-1">
                שם פרטי
              </label>
              <input
                id="patient-name"
                type="text"
                required
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="surgery-date" className="block text-xs font-medium text-slate-700 mb-1">
                תאריך הניתוח
              </label>
              <input
                id="surgery-date"
                type="date"
                required
                value={formState.surgeryDate}
                onChange={(e) => setFormState({ ...formState, surgeryDate: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="operated-side" className="block text-xs font-medium text-slate-700 mb-1">
                הברך המנותחת
              </label>
              <select
                id="operated-side"
                value={formState.operatedSide}
                onChange={(e) =>
                  setFormState({ ...formState, operatedSide: e.target.value as OperatedSide })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white"
              >
                <option value="right">ברך ימין</option>
                <option value="left">ברך שמאל</option>
              </select>
            </div>

            <div>
              <label htmlFor="brace-angle" className="block text-xs font-medium text-slate-700 mb-1">
                זווית כיפוף מאושרת כעת בסד
              </label>
              <select
                id="brace-angle"
                value={formState.allowedBraceFlexionDeg}
                onChange={(e) =>
                  setFormState({ ...formState, allowedBraceFlexionDeg: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white tabular-nums"
              >
                <option value={0}>0° — סד נעול ביישור מלא</option>
                <option value={30}>עד 30° כיפוף</option>
                <option value={60}>עד 60° כיפוף</option>
                <option value={90}>עד 90° כיפוף</option>
                <option value={120}>עד 120° כיפוף</option>
                <option value={140}>ללא הגבלת סד (140°)</option>
              </select>
            </div>

            <div>
              <label htmlFor="weight-bearing" className="block text-xs font-medium text-slate-700 mb-1">
                הנחיית דריכה מהמנתח
              </label>
              <select
                id="weight-bearing"
                value={formState.weightBearing}
                onChange={(e) =>
                  setFormState({
                    ...formState,
                    weightBearing: e.target.value as WeightBearingLevel,
                  })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white"
              >
                {(Object.keys(WEIGHT_BEARING_LABELS) as WeightBearingLevel[]).map((k) => (
                  <option key={k} value={k}>
                    {WEIGHT_BEARING_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pace-pref" className="block text-xs font-medium text-slate-700 mb-1">
                קצב ועומס תרגול מועדף
              </label>
              <select
                id="pace-pref"
                value={formState.pacePreference}
                onChange={(e) =>
                  setFormState({ ...formState, pacePreference: e.target.value as PacePreference })
                }
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 bg-white"
              >
                <option value="gentle">עדין ומתון (פחות חזרות)</option>
                <option value="balanced">מאוזן לפי הפרוטוקול</option>
                <option value="progressive">מתקדם (לאחר אישור פיזיותרפיסט)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-semibold text-slate-900">
                המחשת זווית הסד הנבחרת
              </p>
              <p className="text-xs text-slate-600 leading-relaxed tabular-nums">
                האפליקציה תסנן ותתריע אוטומטית על כל תרגיל החורג מהזווית המאושרת ({formState.allowedBraceFlexionDeg}°).
              </p>
            </div>
            <KneeAngleDiagram
              angleDeg={formState.allowedBraceFlexionDeg}
              maxAllowedDeg={formState.allowedBraceFlexionDeg}
              size="sm"
              className="shrink-0"
            />
          </div>

          <label className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-teal-700 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-slate-900">מצב טקסט מוגדל לקריאה נוחה</p>
                <p className="text-xs text-slate-500">מגדיל את גודל האותיות בכל האפליקציה</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formState.largeTextMode}
              onChange={(e) => {
                const next = { ...formState, largeTextMode: e.target.checked };
                setFormState(next);
                onUpdateProfile(next);
              }}
              className="w-5 h-5 accent-teal-700"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onResetDemoData}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs sm:text-sm font-medium cursor-pointer"
            >
              איפוס נתוני הדגמה
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>שמור ועדכן תוכנית אישית</span>
            </button>
          </div>

          {savedMessage && (
            <p role="status" className="text-sm font-medium text-teal-800">
              {savedMessage}
            </p>
          )}
        </form>

        {/* Core Safety Principles */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl divide-y divide-slate-200 overflow-hidden">
          <div className="p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900">
              עקרונות בטיחות בשיקום פיקת הברך
            </h2>
            <div className="space-y-2">
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <SafeImage
                  src="/src/assets/images/safety_elevation_ice_1794686941365.jpg"
                  alt="איור הדרכה להרמת רגל על שתי כריות מתחת לשוק ולקרסול וקירור הברך במגבת עטופה"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong className="font-semibold text-slate-800">הגבהה וקירור בטוחים: </strong>
                מניחים כריות מתחת לשוק ולקרסול לשמירה על יישור מלא (לא כרית מתחת לברך עצמה), עם קירור עטוף במגבת ל-15 דקות.
              </p>
            </div>
          </div>
          {SAFETY_PRINCIPLES.map((principle, idx) => (
            <div key={idx} className="p-5 space-y-1.5">
              <h3 className="font-semibold text-sm sm:text-base text-slate-900">
                {principle.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{principle.body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
