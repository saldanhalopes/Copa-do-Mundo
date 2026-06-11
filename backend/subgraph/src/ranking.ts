import { EloAtualizado as EloAtualizadoEvent } from "../generated/RankingSeasons/RankingSeasons"
import { Player, RankingSnapshot } from "../generated/schema"

export function handleEloAtualizado(event: EloAtualizadoEvent): void {
  let playerId = event.params.jogador.toHexString()

  let player = Player.load(playerId)
  if (player == null) {
    player = new Player(playerId)
    player.elo = BigInt.fromI32(1000)
    player.wins = 0
    player.losses = 0
    player.matches = []
  }

  player.elo = event.params.novoElo
  player.save()

  let snapshot = new RankingSnapshot(
    playerId + "-" + event.block.timestamp.toString()
  )
  snapshot.player = playerId
  snapshot.elo = event.params.novoElo
  snapshot.won = event.params.venceu
  snapshot.timestamp = event.block.timestamp
  snapshot.save()
}
