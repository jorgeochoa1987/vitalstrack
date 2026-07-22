import type { Measurement } from "../types";

function daysAgo(n: number, hour = 8, minute = 30): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const SEED_MEASUREMENTS: Measurement[] = [
  {
    id: "m1",
    systolic: 118,
    diastolic: 76,
    pulse: 72,
    recordedAt: daysAgo(0, 9, 45),
    notes: "En reposo, después del desayuno",
  },
  {
    id: "m2",
    systolic: 134,
    diastolic: 88,
    pulse: 84,
    recordedAt: daysAgo(1, 20, 20),
  },
  {
    id: "m3",
    systolic: 152,
    diastolic: 96,
    pulse: 92,
    recordedAt: daysAgo(1, 11, 15),
    notes: "Tras una reunión estresante",
  },
  {
    id: "m4",
    systolic: 121,
    diastolic: 79,
    pulse: 68,
    recordedAt: daysAgo(1, 7, 30),
  },
  {
    id: "m5",
    systolic: 124,
    diastolic: 80,
    pulse: 74,
    recordedAt: daysAgo(2, 8, 10),
  },
  {
    id: "m6",
    systolic: 119,
    diastolic: 75,
    pulse: 70,
    recordedAt: daysAgo(3, 8, 45),
  },
  {
    id: "m7",
    systolic: 128,
    diastolic: 82,
    pulse: 78,
    recordedAt: daysAgo(4, 19, 0),
  },
  {
    id: "m8",
    systolic: 116,
    diastolic: 74,
    pulse: 66,
    recordedAt: daysAgo(5, 7, 50),
  },
  {
    id: "m9",
    systolic: 122,
    diastolic: 78,
    pulse: 71,
    recordedAt: daysAgo(6, 8, 20),
  },
  {
    id: "m10",
    systolic: 130,
    diastolic: 84,
    pulse: 80,
    recordedAt: daysAgo(8, 9, 0),
  },
  {
    id: "m11",
    systolic: 126,
    diastolic: 81,
    pulse: 76,
    recordedAt: daysAgo(10, 18, 30),
  },
  {
    id: "m12",
    systolic: 120,
    diastolic: 77,
    pulse: 69,
    recordedAt: daysAgo(12, 8, 0),
  },
];
