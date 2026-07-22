import { createClient } from "@supabase/supabase-js";
import type { Measurement, MeasurementInput } from "../types";
import type { Profile, ProfileInput, Sex } from "../types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env.local",
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface MeasurementRow {
  id: string;
  user_id?: string | null;
  systolic: number;
  diastolic: number;
  pulse: number;
  recorded_at: string;
  notes: string | null;
  photo_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export function rowToMeasurement(row: MeasurementRow): Measurement {
  return {
    id: row.id,
    systolic: row.systolic,
    diastolic: row.diastolic,
    pulse: row.pulse,
    recordedAt: row.recorded_at,
    notes: row.notes ?? undefined,
    photoUrl: row.photo_url ?? undefined,
  };
}

export function inputToRow(input: MeasurementInput, userId: string) {
  return {
    user_id: userId,
    systolic: input.systolic,
    diastolic: input.diastolic,
    pulse: input.pulse,
    recorded_at: input.recordedAt,
    notes: input.notes?.trim() || null,
    photo_url: input.photoUrl || null,
  };
}

export function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    birthDate: row.birth_date ?? undefined,
    sex: row.sex ?? undefined,
    heightCm: row.height_cm ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export function profileToRow(input: ProfileInput) {
  return {
    full_name: input.fullName?.trim() || null,
    birth_date: input.birthDate || null,
    sex: input.sex || null,
    height_cm: input.heightCm ?? null,
    weight_kg: input.weightKg ?? null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };
}
