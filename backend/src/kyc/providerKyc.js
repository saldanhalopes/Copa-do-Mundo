import crypto from "crypto";
import { upsertKycStatus, getKycStatus, getKycStatusByProvider } from "../db/database.js";

const KYC_LEVELS = ["none", "basic", "advanced", "verified"];
const MIN_KYC_FOR_PURCHASE = "basic";
const MIN_KYC_FOR_STAKED_PVP = "verified";

function meetsKycLevel(current, required) {
  const ci = KYC_LEVELS.indexOf(current);
  const ri = KYC_LEVELS.indexOf(required);
  return ci >= ri;
}

const PROVIDER_CONFIGS = {
  crossmint: {
    webhookSecretEnv: "CROSSMINT_WEBHOOK_SECRET",
    kycEndpoint: "https://www.crossmint.com/api/2022-06-09/collections",
  },
  moonpay: {
    webhookSecretEnv: "MOONPAY_WEBHOOK_SECRET",
    kycEndpoint: "https://api.moonpay.com/v1/kyc",
  },
  binance_pay: {
    webhookSecretEnv: "BINANCE_PAY_KYC_SECRET",
    kycEndpoint: "https://merchant.binance.com/api/v1",
  },
};

const JURISDICTION_LIMITS = {
  US: { maxWithoutKyc: 0, kycLevel: "verified", notes: "USA — strict KYC requirements" },
  GB: { maxWithoutKyc: 250, kycLevel: "basic", notes: "UK — £250 threshold before KYC" },
  DE: { maxWithoutKyc: 100, kycLevel: "basic", notes: "Germany — €100" },
  FR: { maxWithoutKyc: 100, kycLevel: "basic", notes: "France — €100" },
  BR: { maxWithoutKyc: 500, kycLevel: "basic", notes: "Brazil — R$~3k equiv" },
  DEFAULT: { maxWithoutKyc: 300, kycLevel: "basic", notes: "Default international" },
};

export function getJurisdictionLimit(countryCode) {
  return JURISDICTION_LIMITS[countryCode] || JURISDICTION_LIMITS.DEFAULT;
}

export function getKycGate(address, minLevel = MIN_KYC_FOR_PURCHASE) {
  const status = getKycStatus(address);
  if (!status || status.kyc_status !== "verified") {
    return { ok: false, blocked: true, reason: "kyc_not_verified" };
  }
  if (!meetsKycLevel(status.kyc_level, minLevel)) {
    return { ok: false, blocked: true, reason: "insufficient_kyc_level", required: minLevel, current: status.kyc_level };
  }
  return { ok: true, status };
}

export function checkPurchaseLimit(address, purchaseAmountUsd, countryCode) {
  const limit = getJurisdictionLimit(countryCode);

  if (purchaseAmountUsd <= limit.maxWithoutKyc) {
    return { ok: true, withinLimit: true, limit };
  }

  const kycGate = getKycGate(address, limit.kycLevel);
  if (!kycGate.ok) {
    return { ok: false, withinLimit: false, limit, kycGate };
  }

  return { ok: true, withinLimit: false, limit, kycGate };
}

function verifyWebhookSignature(payload, signature, secret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(
    typeof payload === "string" ? payload : JSON.stringify(payload)
  ).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function getProviderSecret(provider) {
  const cfg = PROVIDER_CONFIGS[provider];
  if (!cfg) return null;
  return process.env[cfg.webhookSecretEnv] || null;
}

export function handleProviderWebhook(provider, body, headers) {
  const secret = getProviderSecret(provider);
  const signature = headers["x-webhook-signature"] || headers["binancepay-signature"] || "";

  if (secret) {
    const valid = verifyWebhookSignature(body, signature, secret);
    if (!valid) {
      return { ok: false, status: 401, error: "Invalid webhook signature" };
    }
  }

  switch (provider) {
    case "crossmint": {
      const { walletAddress, kycStatus, kycLevel, userId } = body;
      if (!walletAddress) return { ok: false, status: 400, error: "Missing walletAddress" };
      upsertKycStatus({
        address: walletAddress,
        provider: "crossmint",
        providerUserId: userId,
        kycLevel: kycLevel || "verified",
        kycStatus: kycStatus || "verified",
      });
      return { ok: true, status: 200 };
    }
    case "moonpay": {
      const { walletAddress, status, level, customerId } = body;
      if (!walletAddress) return { ok: false, status: 400, error: "Missing walletAddress" };
      upsertKycStatus({
        address: walletAddress,
        provider: "moonpay",
        providerUserId: customerId,
        kycLevel: level || "verified",
        kycStatus: status || "verified",
      });
      return { ok: true, status: 200 };
    }
    case "binance_pay": {
      const { buyerOpenId, walletAddress, kycStatus } = body;
      if (!walletAddress && !buyerOpenId) return { ok: false, status: 400, error: "Missing walletAddress or buyerOpenId" };
      upsertKycStatus({
        address: walletAddress || buyerOpenId,
        provider: "binance_pay",
        providerUserId: buyerOpenId,
        kycLevel: "verified",
        kycStatus: kycStatus || "verified",
      });
      return { ok: true, status: 200 };
    }
    default:
      return { ok: false, status: 400, error: `Unknown provider: ${provider}` };
  }
}

export function getKycStatusForUser(address) {
  const status = getKycStatus(address);
  if (!status) {
    return { verified: false, reason: "no_kyc_record" };
  }
  return {
    verified: status.kyc_status === "verified",
    provider: status.provider,
    kycLevel: status.kyc_level,
    kycStatus: status.kyc_status,
    verifiedAt: status.verified_at,
    countryCode: status.country_code,
  };
}

export { KYC_LEVELS, MIN_KYC_FOR_PURCHASE, MIN_KYC_FOR_STAKED_PVP, JURISDICTION_LIMITS, PROVIDER_CONFIGS };
