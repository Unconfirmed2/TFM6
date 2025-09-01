export const playerIndex = <T extends { color: string }>(
  color: string,
  players: Array<T>,
): number => {
  for (let idx = 0; idx < players.length; idx++) {
    if (players[idx].color === color) {
      return idx;
    }
  }
  return -1;
};

export const rotatePlayersStartingAt = <T extends { color: string }>(
  players: Array<T>,
  startColor?: string,
): Array<T> => {
  if (!startColor) return players;
  const idx = playerIndex(startColor, players);
  if (idx === -1) return players;
  return players.slice(idx).concat(players.slice(0, idx));
};
