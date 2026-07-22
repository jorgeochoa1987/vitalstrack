export type BpStatus =
  | "normal"
  | "elevated"
  | "stage1"
  | "stage2"
  | "crisis";

export type Sex = "male" | "female" | "other" | "unspecified";

export interface Measurement {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  recordedAt: string;
  notes?: string;
  photoUrl?: string;
}

export interface MeasurementInput {
  systolic: number;
  diastolic: number;
  pulse: number;
  recordedAt: string;
  notes?: string;
  photoUrl?: string;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  birthDate?: string;
  sex?: Sex;
  heightCm?: number;
  weightKg?: number;
  notes?: string;
}

export interface ProfileInput {
  fullName?: string;
  birthDate?: string;
  sex?: Sex | "";
  heightCm?: number | null;
  weightKg?: number | null;
  notes?: string;
}
