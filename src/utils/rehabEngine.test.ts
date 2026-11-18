import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMedicalTeamSummary,
  calculateCurrentWeek,
  calculateDaysPostOp,
  canUnlockStage,
  computeDashboardMetrics,
  evaluatePainSafety,
  personalizeExercise,
} from './rehabEngine';
import { EXERCISES, REHAB_STAGES } from '../data/rehabProtocol';
import type { DailyLogEntry, PatientProfile, RehabStageId, StageClearanceRecord } from '../types/rehab';

const baseProfile: PatientProfile = {
  name: 'רבקה',
  surgeryDate: '2026-11-01',
  operatedSide: 'right',
  allowedBraceFlexionDeg: 30,
  weightBearing: 'partial',
  pacePreference: 'balanced',
  largeTextMode: false,
};

test('calculateDaysPostOp and calculateCurrentWeek compute exact post-op timeline', () => {
  assert.equal(calculateDaysPostOp('2026-11-01', '2026-11-01'), 0);
  assert.equal(calculateDaysPostOp('2026-11-01', '2026-11-15'), 14);
  assert.equal(calculateCurrentWeek(0), 1);
  assert.equal(calculateCurrentWeek(14), 3);
});

test('personalizeExercise restricts exercises exceeding allowed brace flexion angle or weight bearing', () => {
  const heelSlides = EXERCISES.find((e) => e.id === 'ex_heel_slides')!;
  const seatedFlexion = EXERCISES.find((e) => e.id === 'ex_seated_assisted_flexion')!;
  const lowStepUp = EXERCISES.find((e) => e.id === 'ex_low_step_up')!;

  const pHeel = personalizeExercise(heelSlides, baseProfile);
  assert.equal(pHeel.isSafeForCurrentLimits, true);

  // Allowed angle is 30°, seatedFlexion requires 60°
  const pSeated = personalizeExercise(seatedFlexion, baseProfile);
  assert.equal(pSeated.isSafeForCurrentLimits, false);
  assert.ok(pSeated.safetyLockReason?.includes('60°'));

  // No weight bearing blocks step-ups
  const noWbProfile: PatientProfile = { ...baseProfile, allowedBraceFlexionDeg: 110, weightBearing: 'none' };
  const pStep = personalizeExercise(lowStepUp, noWbProfile);
  assert.equal(pStep.isSafeForCurrentLimits, false);
});

test('personalizeExercise scales reps gently for gentle pace preference', () => {
  const quadSets = EXERCISES.find((e) => e.id === 'ex_quad_sets')!;
  const gentleProfile: PatientProfile = { ...baseProfile, pacePreference: 'gentle' };
  const personalized = personalizeExercise(quadSets, gentleProfile);
  assert.equal(personalized.personalizedReps, 8);
  assert.equal(personalized.personalizedSets, 2);
});

test('canUnlockStage enforces sequential clinician clearance before starting next stage', () => {
  const clearances: Record<RehabStageId, StageClearanceRecord> = {
    1: { stageId: 1, status: 'cleared', checkedCriteriaIds: ['s1_c1'], patientQuestions: '' },
    2: { stageId: 2, status: 'pending_consultation', checkedCriteriaIds: [], patientQuestions: '' },
    3: { stageId: 3, status: 'locked', checkedCriteriaIds: [], patientQuestions: '' },
    4: { stageId: 4, status: 'locked', checkedCriteriaIds: [], patientQuestions: '' },
  };

  assert.equal(canUnlockStage(1, clearances).allowed, true);
  assert.equal(canUnlockStage(2, clearances).allowed, true);
  assert.equal(canUnlockStage(3, clearances).allowed, false);
});

test('evaluatePainSafety flags high pain (>=8) or pain>=7 with severe swelling as stop_consult', () => {
  assert.equal(evaluatePainSafety(3, 'mild').level, 'safe');
  assert.equal(evaluatePainSafety(6, 'mild').level, 'caution');
  assert.equal(evaluatePainSafety(8, 'none').level, 'stop_consult');
  assert.equal(evaluatePainSafety(7, 'severe').level, 'stop_consult');
});

test('computeDashboardMetrics and buildMedicalTeamSummary aggregate pain, stiffness, swelling, and ROM accurately', () => {
  const logs: DailyLogEntry[] = [
    {
      id: '1',
      date: '2026-11-14',
      painLevel: 3,
      stiffnessLevel: 4,
      swellingLevel: 'mild',
      flexionDegrees: 65,
      extensionZeroAchieved: true,
      context: 'morning',
      notes: 'שיפור מורגש',
      createdAt: '2026-11-14T08:00:00Z',
    },
    {
      id: '2',
      date: '2026-11-13',
      painLevel: 4,
      stiffnessLevel: 5,
      swellingLevel: 'moderate',
      flexionDegrees: 55,
      extensionZeroAchieved: true,
      context: 'after_exercise',
      notes: '',
      createdAt: '2026-11-13T18:00:00Z',
    },
    {
      id: '3',
      date: '2026-11-12',
      painLevel: 4,
      stiffnessLevel: 6,
      swellingLevel: 'moderate',
      flexionDegrees: 50,
      extensionZeroAchieved: true,
      context: 'evening',
      notes: '',
      createdAt: '2026-11-12T19:00:00Z',
    },
    {
      id: '4',
      date: '2026-11-11',
      painLevel: 6,
      stiffnessLevel: 7,
      swellingLevel: 'severe',
      flexionDegrees: 40,
      extensionZeroAchieved: false,
      context: 'morning',
      notes: '',
      createdAt: '2026-11-11T09:00:00Z',
    },
    {
      id: '5',
      date: '2026-11-10',
      painLevel: 6,
      stiffnessLevel: 7,
      swellingLevel: 'moderate',
      flexionDegrees: 35,
      extensionZeroAchieved: false,
      context: 'morning',
      notes: '',
      createdAt: '2026-11-10T09:00:00Z',
    },
    {
      id: '6',
      date: '2026-11-09',
      painLevel: 7,
      stiffnessLevel: 8,
      swellingLevel: 'severe',
      flexionDegrees: 30,
      extensionZeroAchieved: false,
      context: 'evening',
      notes: '',
      createdAt: '2026-11-09T20:00:00Z',
    },
  ];

  const quad = personalizeExercise(EXERCISES[0], baseProfile);
  const metrics = computeDashboardMetrics(logs, [quad.id], [quad]);
  assert.equal(metrics.todayCompletionPercent, 100);
  assert.equal(metrics.latestPain, 3);
  assert.equal(metrics.latestStiffness, 4);
  assert.equal(metrics.latestFlexion, 65);
  assert.equal(metrics.painTrendDirection, 'improving');

  const summary = buildMedicalTeamSummary(
    baseProfile,
    REHAB_STAGES[1],
    logs,
    {
      1: { stageId: 1, status: 'cleared', clinicianName: 'ד"ר לוי', clearedDate: '2026-11-02', checkedCriteriaIds: [], patientQuestions: '' },
      2: { stageId: 2, status: 'cleared', clinicianName: 'ד"ר לוי', clearedDate: '2026-11-12', checkedCriteriaIds: [], patientQuestions: '' },
      3: { stageId: 3, status: 'pending_consultation', checkedCriteriaIds: [], patientQuestions: '' },
      4: { stageId: 4, status: 'locked', checkedCriteriaIds: [], patientQuestions: '' },
    },
    '2026-11-14'
  );

  assert.equal(summary.daysPostOp, 13);
  assert.equal(summary.maxFlexionDeg, 65);
  assert.equal(summary.moderateOrSevereSwellingDays, 5);
  assert.ok(summary.formattedReportText.includes('סיכום מעקב שיקום לצוות הרפואי'));
  assert.ok(summary.formattedReportText.includes('ד"ר לוי'));
});
