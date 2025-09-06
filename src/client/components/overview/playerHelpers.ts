export function playerIndex(color: any, players: Array<any>): number {
  for (let idx = 0; idx < players.length; idx++) {
    if (players[idx].color === color) {
      return idx;
    }
  }
  return -1;
}

export function isFirstForGen(player: any, players: Array<any>): boolean {
  return playerIndex(player.color, players) === 0;
}

export function getPlayersInOrder(players: Array<any>, thisPlayer: any): Array<any> {
  if (!thisPlayer) return players;
  const currentPlayerIndex = players.findIndex((p: any) => p.color === thisPlayer.color);
  const currentPlayerOffset = currentPlayerIndex >= 0 ? currentPlayerIndex : 0;
  return players.slice(currentPlayerOffset).concat(players.slice(0, currentPlayerOffset));
}
