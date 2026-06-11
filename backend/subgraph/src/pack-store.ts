import { PacoteAberto as PacoteAbertoEvent } from "../generated/PackStore/PackStore"
import { PackOpened, Player } from "../generated/schema"

export function handlePacoteAberto(event: PacoteAbertoEvent): void {
  let buyerId = event.params.comprador.toHexString()

  let player = Player.load(buyerId)
  if (player == null) {
    player = new Player(buyerId)
    player.elo = BigInt.fromI32(1000)
    player.wins = 0
    player.losses = 0
    player.matches = []
  }
  player.save()

  let packOpened = new PackOpened(event.transaction.hash.toHexString())
  packOpened.buyer = buyerId
  packOpened.tokenIds = event.params.ids
  packOpened.timestamp = event.block.timestamp
  packOpened.transactionHash = event.transaction.hash
  packOpened.save()
}
