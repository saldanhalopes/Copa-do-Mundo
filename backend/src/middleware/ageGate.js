import { checkAgeGate, getVerificationStatus } from "../kyc/ageVerification.js";

export function requireAge(minAge = 18) {
  return (req, res, next) => {
    const address = req.user?.address;
    if (!address) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const result = checkAgeGate(address, minAge);
    if (!result.ok) {
      return res.status(403).json({
        error: "Age verification required",
        reason: result.reason,
        message: result.reason === "underage"
          ? `Must be ${minAge}+ to use this feature`
          : "Verify your age first",
      });
    }
    next();
  };
}

export function requireAgeWebSocket(address, minAge = 18) {
  const result = checkAgeGate(address, minAge);
  if (!result.ok) {
    return { allowed: false, reason: result.reason, error: `Must be ${minAge}+ to stake` };
  }
  return { allowed: true };
}
