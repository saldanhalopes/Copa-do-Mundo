import { DesempenhoRegistrado as DesempenhoRegistradoEvent } from "../generated/FantasyLeague/FantasyLeague"
import { Performance } from "../generated/schema"

export function handleDesempenhoRegistrado(event: DesempenhoRegistradoEvent): void {
  let perfId = event.params.tokenId.toString() + "-" + event.params.rodada.toString()

  let perf = new Performance(perfId)
  perf.tokenId = event.params.tokenId
  perf.rodada = event.params.rodada
  perf.pontos = event.params.pontos
  perf.timestamp = event.block.timestamp
  perf.save()
}
