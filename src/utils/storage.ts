import type { DailyLogEntry, PatientProfile, RehabStageId, StageClearanceRecord } from '../types/rehab';

export interface RehabAppState {
  profile: PatientProfile;
  activeStageId: RehabStageId;
  clearances: Record<RehabStageId, StageClearanceRecord>;
  completedByDate: Record<string, string[]>;
  logs: DailyLogEntry[];
}

const STORAGE_KEY = 'patella_rehab_state_v1';

function offsetDateStr(daysOffset: number): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysOffset);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateStr(): string {
  return offsetDateStr(0);
}

export function createInitialState(): RehabAppState {
  const surgeryDate = offsetDateStr(-16); // 16 days post-op by default so Stage 1 is cleared & Stage 2 ready for consultation/cleared

  return {
    profile: {
      name: 'רבקה',
      surgeryDate,
      operatedSide: 'right',
      allowedBraceFlexionDeg: 30,
      weightBearing: 'partial',
      pacePreference: 'balanced',
      largeTextMode: false,
    },
    activeStageId: 2,
    clearances: {
      1: {
        stageId: 1,
        status: 'cleared',
        clinicianName: 'ד"ר אורי מזרחי',
        clinicianRole: 'orthopedist',
        clearedDate: offsetDateStr(-15),
        notes: 'שחרור ממחלקה: סד נעול ב-0° בהליכה, תרגילי קרסול ואיזומטרי ארבע-ראשי.',
        checkedCriteriaIds: ['s1_c1', 's1_c2', 's1_c3'],
        patientQuestions: '',
      },
      2: {
        stageId: 2,
        status: 'cleared',
        clinicianName: 'מיכל ברק (פיזיותרפיסטית)',
        clinicianRole: 'physiotherapist',
        clearedDate: offsetDateStr(-2),
        notes: 'פתיחת סד הדרגתית עד 30° לביצוע החלקות עקב עדינות. להימנע מכאב חד.',
        checkedCriteriaIds: ['s2_c1', 's2_c2', 's2_c3'],
        patientQuestions: 'מתי ניתן יהיה לעבור מ-30° ל-60°?',
      },
      3: {
        stageId: 3,
        status: 'pending_consultation',
        checkedCriteriaIds: [],
        patientQuestions: 'האם צילום הביקורת בשבוע 6 מראה איחוי מספק לגמילה הדרגתית מהסד?',
      },
      4: {
        stageId: 4,
        status: 'locked',
        checkedCriteriaIds: [],
        patientQuestions: '',
      },
    },
    completedByDate: {
      [offsetDateStr(0)]: ['ex_ankle_pumps'],
      [offsetDateStr(-1)]: ['ex_ankle_pumps', 'ex_quad_sets', 'ex_heel_slides'],
    },
    logs: [
      {
        id: 'seed_6',
        date: offsetDateStr(-6),
        painLevel: 7,
        stiffnessLevel: 8,
        swellingLevel: 'severe',
        flexionDegrees: 15,
        extensionZeroAchieved: false,
        context: 'morning',
        notes: 'נפיחות בולטת לאחר יום עמוס, קירור והרמת רגל הקלו.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'seed_5',
        date: offsetDateStr(-5),
        painLevel: 6,
        stiffnessLevel: 7,
        swellingLevel: 'moderate',
        flexionDegrees: 20,
        extensionZeroAchieved: true,
        context: 'after_exercise',
        notes: 'הצלחתי יישור מלא (0°).',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'seed_4',
        date: offsetDateStr(-4),
        painLevel: 5,
        stiffnessLevel: 6,
        swellingLevel: 'moderate',
        flexionDegrees: 20,
        extensionZeroAchieved: true,
        context: 'evening',
        notes: 'שריר הארבע-ראשי מגיב טוב יותר לכיווץ.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'seed_3',
        date: offsetDateStr(-3),
        painLevel: 5,
        stiffnessLevel: 6,
        swellingLevel: 'mild',
        flexionDegrees: 25,
        extensionZeroAchieved: true,
        context: 'rest',
        notes: 'הנפיחות ירדה מעט.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'seed_2',
        date: offsetDateStr(-2),
        painLevel: 4,
        stiffnessLevel: 5,
        swellingLevel: 'mild',
        flexionDegrees: 25,
        extensionZeroAchieved: true,
        context: 'during_exercise',
        notes: 'התחלת החלקות עקב עד 30° באישור הפיזיותרפיסטית.',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'seed_1',
        date: offsetDateStr(-1),
        painLevel: 3,
        stiffnessLevel: 4,
        swellingLevel: 'mild',
        flexionDegrees: 30,
        extensionZeroAchieved: true,
        context: 'morning',
        notes: 'פחות נוקשות בבוקר, הרגשה יציבה ומעודדת.',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function loadAppState(): RehabAppState {
  if (typeof window === 'undefined') {
    return createInitialState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<RehabAppState>;
    const fallback = createInitialState();
    const mergedProfile = { ...fallback.profile, ...(parsed.profile ?? {}) };
    if (mergedProfile.name === 'דניאל') {
      mergedProfile.name = 'רבקה';
    }
    return {
      profile: mergedProfile,
      activeStageId: parsed.activeStageId ?? fallback.activeStageId,
      clearances: { ...fallback.clearances, ...(parsed.clearances ?? {}) },
      completedByDate: parsed.completedByDate ?? fallback.completedByDate,
      logs: Array.isArray(parsed.logs) ? parsed.logs : fallback.logs,
    };
  } catch {
    return createInitialState();
  }
}

export function saveAppState(state: RehabAppState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors cleanly
  }
}
