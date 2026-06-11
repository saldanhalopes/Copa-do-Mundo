import { ethers } from "ethers";
import config from "../config.js";

const MATCH_ESCROW_ABI = [
  "function setAgeVerified(address wallet, bool verified) external",
  "function isEligibleForStakedPvP(address wallet) external view returns (bool)",
  "function setMinAgeStakedPvP(uint8 _minAge) external",
  "function setJurisdictionMinAge(bytes32 jurisdictionCode, uint8 _minAge) external",
  "function AGE_VERIFIER_ROLE() external view returns (bytes32)",
];

let verifierWallet = null;
let matchEscrowContract = null;

function getVerifier() {
  if (verifierWallet) return verifierWallet;
  if (!config.AGE_VERIFIER_PRIVATE_KEY) {
    console.warn("[ChainVerification] AGE_VERIFIER_PRIVATE_KEY not set — skipping on-chain verification");
    return null;
  }
  if (!config.RPC_URLS.polygon && !config.RPC_URLS.bsc) {
    console.warn("[ChainVerification] No RPC URL configured — skipping on-chain verification");
    return null;
  }
  const rpcUrl = config.RPC_URLS.polygon || config.RPC_URLS.bsc;
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  verifierWallet = new ethers.Wallet(config.AGE_VERIFIER_PRIVATE_KEY, provider);
  return verifierWallet;
}

function getContract() {
  if (matchEscrowContract) return matchEscrowContract;
  const signer = getVerifier();
  if (!signer || !config.CONTRACT_ADDRESSES.MatchEscrow) return null;
  matchEscrowContract = new ethers.Contract(
    config.CONTRACT_ADDRESSES.MatchEscrow,
    MATCH_ESCROW_ABI,
    signer
  );
  return matchEscrowContract;
}

export async function verifyAgeOnChain(address, age) {
  const contract = getContract();
  if (!contract) {
    return { ok: false, chain: false, reason: "contract_not_configured" };
  }
  try {
    const eligible = age >= (config.MIN_AGE_STAKED_PVP || 18);
    const tx = await contract.setAgeVerified(address, eligible);
    const receipt = await tx.wait();
    return { ok: true, chain: true, txHash: receipt.hash, eligible };
  } catch (err) {
    console.error("[ChainVerification] Failed to verify age on-chain:", err.message);
    return { ok: false, chain: false, reason: err.message };
  }
}

export async function checkChainEligibility(address) {
  const contract = getContract();
  if (!contract) return null;
  try {
    return await contract.isEligibleForStakedPvP(address);
  } catch {
    return null;
  }
}
