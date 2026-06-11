import { Address, BigInt } from "@graphprotocol/graph-ts"
import {
  MatchEscrow as MatchEscrowContract,
  PartidaResolvida as PartidaResolvidaEvent,
  PartidaCriada as PartidaCriadaEvent,
  PartidaAceita as PartidaAceitaEvent
} from "../generated/MatchEscrow/MatchEscrow"
import { Match, Player } from "../generated/schema"

class MatchPlayers {
  playerA: string
  playerB: string
  stake: BigInt
}

function ensurePlayer(id: string): Player {
  let player = Player.load(id)
  if (player == null) {
    player = new Player(id)
    player.elo = BigInt.fromI32(1000)
    player.wins = 0
    player.losses = 0
    player.matches = []
  }
  return player as Player
}

function fetchMatchPlayers(matchId: BigInt, contractAddress: Address): MatchPlayers {
  let contract = MatchEscrowContract.bind(contractAddress)
  let partida = contract.partidas(matchId)
  return {
    playerA: partida.jogadorA.toHexString(),
    playerB: partida.jogadorB.toHexString(),
    stake: partida.stake
  }
}

export function handlePartidaCriada(event: PartidaCriadaEvent): void {
  ensurePlayer(event.params.jogadorA.toHexString()).save()
}

export function handlePartidaAceita(event: PartidaAceitaEvent): void {
  ensurePlayer(event.params.jogadorB.toHexString()).save()
}

export function handlePartidaResolvida(event: PartidaResolvidaEvent): void {
  let matchPlayers = fetchMatchPlayers(event.params.id, event.address)

  let matchEntity = new Match(event.params.id.toString())
  matchEntity.playerA = matchPlayers.playerA
  matchEntity.playerB = matchPlayers.playerB
  matchEntity.winner = event.params.vencedor.toHexString()
  matchEntity.stake = matchPlayers.stake
  matchEntity.scoreA = event.params.placarA
  matchEntity.scoreB = event.params.placarB
  matchEntity.timestamp = event.block.timestamp
  matchEntity.save()

  let playerA = ensurePlayer(matchPlayers.playerA)
  let playerB = ensurePlayer(matchPlayers.playerB)
  let winnerId = event.params.vencedor.toHexString()

  if (winnerId == matchPlayers.playerA) {
    playerA.wins += 1
    playerB.losses += 1
  } else {
    playerB.wins += 1
    playerA.losses += 1
  }

  let aMatches = playerA.matches
  aMatches.push(matchEntity.id)
  playerA.matches = aMatches

  let bMatches = playerB.matches
  bMatches.push(matchEntity.id)
  playerB.matches = bMatches

  playerA.save()
  playerB.save()
}
