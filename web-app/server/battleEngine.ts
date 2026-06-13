export interface BattleCard {
  id: number;
  name: string;
  ovr: number;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  rarity: string;
}

export interface BattleRound {
  round: number;
  challengerCard: number;
  opponentCard: number;
  challengerScore: number;
  opponentScore: number;
  winner: "challenger" | "opponent";
}

export interface BattleResult {
  rounds: BattleRound[];
  challengerWins: number;
  opponentWins: number;
  winner: "challenger" | "opponent";
}

export default function simulateBattle(
  challengerCards: (BattleCard | null)[],
  opponentCards: (BattleCard | null)[]
): BattleResult {
  const rounds: BattleRound[] = [];
  let challengerWins = 0;
  let opponentWins = 0;

  const maxRounds = Math.min(
    challengerCards.filter(Boolean).length,
    opponentCards.filter(Boolean).length,
    5
  );

  for (let i = 0; i < maxRounds; i++) {
    const cc = challengerCards[i];
    const oc = opponentCards[i];
    if (!cc || !oc) break;

    // Score = OVR base + bônus de raridade + aleatoriedade
    const rarityBonus = (c: BattleCard) => {
      if (c.rarity === "mitica") return 10;
      if (c.rarity === "lendaria") return 6;
      if (c.rarity === "rara") return 3;
      return 0;
    };

    const cScore = cc.ovr + rarityBonus(cc) + Math.floor(Math.random() * 12);
    const oScore = oc.ovr + rarityBonus(oc) + Math.floor(Math.random() * 12);
    const roundWinner: "challenger" | "opponent" = cScore >= oScore ? "challenger" : "opponent";

    if (roundWinner === "challenger") challengerWins++;
    else opponentWins++;

    rounds.push({
      round: i + 1,
      challengerCard: cc.id,
      opponentCard: oc.id,
      challengerScore: cScore,
      opponentScore: oScore,
      winner: roundWinner,
    });
  }

  return {
    rounds,
    challengerWins,
    opponentWins,
    winner: challengerWins >= opponentWins ? "challenger" : "opponent",
  };
}
