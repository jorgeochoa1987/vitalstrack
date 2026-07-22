const ONBOARDING_KEY = "vitalstrack.onboarding.done.";

export function isOnboardingDone(
  userId: string,
  profile: { birthDate?: string; heightCm?: number } | null,
) {
  try {
    if (localStorage.getItem(ONBOARDING_KEY + userId) === "1") return true;
  } catch {
    /* ignore */
  }
  return Boolean(profile?.birthDate && profile?.heightCm);
}

export function markOnboardingDone(userId: string) {
  localStorage.setItem(ONBOARDING_KEY + userId, "1");
}

export function clearOnboardingDone(userId: string) {
  localStorage.removeItem(ONBOARDING_KEY + userId);
}
