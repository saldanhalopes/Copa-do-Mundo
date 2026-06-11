import { getAgeStatus, setAgeVerification } from "../db/database.js";

const MIN_AGE_STAKED_PVP = 18;
const MIN_AGE_ACCOUNT = 13;
const MAX_AGE_SECONDS = 100 * 365.25 * 86400;

export function calculateAge(dateOfBirth) {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function isValidDateOfBirth(dateOfBirth) {
  const ts = Date.parse(dateOfBirth);
  if (isNaN(ts)) return false;
  const age = calculateAge(dateOfBirth);
  if (age < 0 || age > 120) return false;
  return true;
}

export function meetsAgeRequirement(dateOfBirth, minAge) {
  if (!dateOfBirth) return false;
  return calculateAge(dateOfBirth) >= minAge;
}

export function registerAge(address, { dateOfBirth, method = "self_declared" }) {
  if (!isValidDateOfBirth(dateOfBirth)) {
    return { ok: false, error: "Invalid date of birth" };
  }
  const age = calculateAge(dateOfBirth);
  if (age < MIN_AGE_ACCOUNT) {
    return { ok: false, error: `Minimum age for account is ${MIN_AGE_ACCOUNT}` };
  }
  const player = setAgeVerification(address, { dateOfBirth, method });
  return { ok: true, age, player };
}

export function checkAgeGate(address, minAge = MIN_AGE_STAKED_PVP) {
  const status = getAgeStatus(address);
  if (!status || !status.date_of_birth) {
    return { ok: false, blocked: true, reason: "age_not_verified" };
  }
  if (!meetsAgeRequirement(status.date_of_birth, minAge)) {
    return { ok: false, blocked: true, reason: "underage", minAge };
  }
  return { ok: true, blocked: false };
}

export function getVerificationStatus(address) {
  const status = getAgeStatus(address);
  if (!status || !status.date_of_birth) {
    return { verified: false, reason: "not_verified" };
  }
  const age = calculateAge(status.date_of_birth);
  return {
    verified: true,
    age,
    dateOfBirth: status.date_of_birth,
    verifiedAt: status.age_verified_at,
    method: status.age_verification_method,
    canStake: age >= MIN_AGE_STAKED_PVP,
  };
}

export { MIN_AGE_STAKED_PVP, MIN_AGE_ACCOUNT };
