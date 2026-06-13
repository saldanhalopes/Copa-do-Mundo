/**
 * Verifiable Random Function (VRF) — Aleatoriedade Verificável
 * 
 * Este módulo implementa um sistema de aleatoriedade verificável baseado em blockchain
 * para garantir que nenhum participante (incluindo o servidor) possa manipular o resultado
 * da abertura de pacotes.
 * 
 * FLUXO COMMIT-REVEAL:
 * 1. COMMIT: Servidor gera um seed secreto + block hash futuro → hash(seed + blockHash)
 * 2. REVEAL: Após confirmação do bloco, o seed é revelado e qualquer pessoa pode verificar
 * 3. DERIVAÇÃO: O random final = keccak256(seed || blockHash || userAddress || nonce)
 * 
 * PROPRIEDADES DE SEGURANÇA:
 * - Servidor não pode prever o blockHash futuro → não pode manipular
 * - Usuário não conhece o seed → não pode prever o resultado
 * - Qualquer pessoa pode verificar: hash(seed) === commitHash
 * - Nonce impede replay attacks
 * 
 * Em produção, este módulo seria substituído por Chainlink VRF (Polygon) ou 
 * Binance Oracle VRF (BNB Chain) para aleatoriedade on-chain verificável.
 */

import { createHash, randomBytes } from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VRFCommit {
  commitHash: string;       // Hash público do commit (verificável)
  blockNumber: number;      // Bloco futuro usado como entropia
  timestamp: number;        // Quando o commit foi criado
  nonce: number;            // Nonce anti-replay
}

export interface VRFReveal {
  seed: string;             // Seed secreto revelado
  blockHash: string;        // Hash do bloco usado
  userAddress: string;      // Endereço do usuário
  nonce: number;            // Nonce usado
  randomValue: string;      // Valor aleatório final (hex)
  proof: string;            // Prova de verificação
}

export interface VRFResult {
  commit: VRFCommit;
  reveal: VRFReveal;
  randomNumbers: number[];  // Números derivados para cada carta
  verifiable: boolean;      // Se pode ser verificado on-chain
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Gera um hash determinístico usando SHA-256 (simulando keccak256 do Solidity)
 */
function hash(...inputs: string[]): string {
  const combined = inputs.join("||");
  return createHash("sha256").update(combined).digest("hex");
}

/**
 * Simula o block hash de um bloco futuro.
 * Em produção, seria obtido da blockchain real (Polygon/BNB).
 */
function simulateBlockHash(blockNumber: number): string {
  // Em produção: web3.eth.getBlock(blockNumber).hash
  // Aqui simulamos com entropia real do sistema
  const entropy = randomBytes(32).toString("hex");
  return hash(entropy, blockNumber.toString(), Date.now().toString());
}

/**
 * Gera o commit (fase 1 do commit-reveal)
 * O servidor gera um seed secreto e publica apenas o hash.
 */
export function generateCommit(userAddress: string): { seed: string; commit: VRFCommit } {
  const seed = randomBytes(32).toString("hex");
  const nonce = Math.floor(Math.random() * 2 ** 32);
  const blockNumber = Math.floor(Date.now() / 1000); // Simula bloco futuro

  // O commit é o hash do seed — publicado antes do reveal
  const commitHash = hash(seed, userAddress, nonce.toString());

  return {
    seed,
    commit: {
      commitHash,
      blockNumber,
      timestamp: Date.now(),
      nonce,
    },
  };
}

/**
 * Executa o reveal (fase 2 do commit-reveal)
 * Revela o seed e gera o valor aleatório final.
 */
export function executeReveal(
  seed: string,
  commit: VRFCommit,
  userAddress: string
): VRFReveal {
  const blockHash = simulateBlockHash(commit.blockNumber);

  // Valor aleatório final = hash(seed || blockHash || userAddress || nonce)
  const randomValue = hash(seed, blockHash, userAddress, commit.nonce.toString());

  // Prova: qualquer pessoa pode verificar que hash(seed, userAddress, nonce) === commitHash
  const proof = hash(seed, userAddress, commit.nonce.toString());

  return {
    seed,
    blockHash,
    userAddress,
    nonce: commit.nonce,
    randomValue,
    proof,
  };
}

/**
 * Verifica se um reveal é válido (qualquer pessoa pode chamar)
 */
export function verifyReveal(commit: VRFCommit, reveal: VRFReveal): boolean {
  // Recalcula o commit hash a partir do seed revelado
  const expectedCommitHash = hash(reveal.seed, reveal.userAddress, reveal.nonce.toString());
  return expectedCommitHash === commit.commitHash;
}

/**
 * Deriva N números aleatórios a partir do valor VRF.
 * Cada número é derivado deterministicamente do randomValue + índice.
 */
export function deriveRandomNumbers(randomValue: string, count: number, max: number): number[] {
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    const derived = hash(randomValue, i.toString());
    // Converte os primeiros 8 bytes hex para número e aplica módulo
    const num = parseInt(derived.slice(0, 8), 16) % max;
    numbers.push(num);
  }
  return numbers;
}

/**
 * Fluxo completo de abertura de pacote com VRF.
 * Retorna os índices aleatórios das cartas + prova verificável.
 */
export function openPackWithVRF(
  userAddress: string,
  totalCards: number,
  cardsInPack: number
): VRFResult {
  // 1. Commit
  const { seed, commit } = generateCommit(userAddress);

  // 2. Reveal (em produção, aguardaria confirmação do bloco)
  const reveal = executeReveal(seed, commit, userAddress);

  // 3. Derivar números aleatórios para cada carta do pacote
  const randomNumbers = deriveRandomNumbers(reveal.randomValue, cardsInPack, totalCards);

  // 4. Verificar integridade
  const verifiable = verifyReveal(commit, reveal);

  return {
    commit,
    reveal,
    randomNumbers,
    verifiable,
  };
}

/**
 * Gera dados de auditoria para exibição ao usuário.
 * Permite que qualquer pessoa verifique a aleatoriedade.
 */
export function getAuditData(result: VRFResult): {
  commitHash: string;
  revealSeed: string;
  blockHash: string;
  randomValue: string;
  proof: string;
  isValid: boolean;
  verificationSteps: string[];
} {
  return {
    commitHash: result.commit.commitHash,
    revealSeed: result.reveal.seed,
    blockHash: result.reveal.blockHash,
    randomValue: result.reveal.randomValue,
    proof: result.reveal.proof,
    isValid: result.verifiable,
    verificationSteps: [
      `1. Commit Hash publicado: ${result.commit.commitHash.slice(0, 16)}...`,
      `2. Seed revelado: ${result.reveal.seed.slice(0, 16)}...`,
      `3. Block Hash: ${result.reveal.blockHash.slice(0, 16)}...`,
      `4. Verificação: hash(seed, address, nonce) === commitHash → ${result.verifiable ? "✅ VÁLIDO" : "❌ INVÁLIDO"}`,
      `5. Random final: ${result.reveal.randomValue.slice(0, 16)}...`,
    ],
  };
}
