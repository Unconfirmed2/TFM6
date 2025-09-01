<template>
  <div class="player-info-top-container">
    <PlayerInfoTopDuplicate
      v-for="(p, idx) in rotatedPlayers"
      :key="p.color + '-' + idx"
      :player="p"
      :playerView="playerView"
      :firstForGen="isFirstForGen(p)"
      :playerIndex="idx"
      :hideZeroTags="true"
      :isTopBar="true"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import PlayerInfo from '@/client/components/overview/PlayerInfo.vue';
import PlayerInfoTopDuplicate from '@/client/components/overview/PlayerInfoTopDuplicate.vue';
import { PlayerViewModel } from '@/common/models/PlayerModel';
import { rotatePlayersStartingAt, playerIndex } from '@/client/utils/playerOrder';

export default Vue.extend({
  name: 'player-info-top-container',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
    },
  },
  components: {
  PlayerInfo,
  PlayerInfoTopDuplicate,
  },
  computed: {
  rotatedPlayers(): any[] {
      // use the same rotation logic as the main players overview when thisPlayer is present
      // import is avoided here; parent can pass rotated array if desired. Fallback to raw list.
      const pv = (this as any).playerView;
      return pv && pv.thisPlayer
        ? rotatePlayersStartingAt(pv.players, pv.thisPlayer.color)
        : pv.players;
    },
  },
  methods: {
    isFirstForGen(player: any): boolean {
      const pv = (this as any).playerView;
      return playerIndex(player.color, pv.players) === 0;
    },
  },
});
</script>

<style scoped>
.player-info-top-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap; /* allow .player-info cards to wrap onto multiple rows */
  margin-bottom: 12px;
}

/* Make each player-info card a vertical column so tags sit below status
   Use inline-flex so the card acts like an inline-block (flows horizontally)
   but still provides flex layout for its children. Set a fixed width so
   all top-bar cards have consistent width; change to `width: fit-content`
   if you prefer a shrink-to-fit behavior. */
.player-info-top-container > .player-info {
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  /* shrink-to-fit width so the card sizes to its contents */
  width: -moz-fit-content;
  width: fit-content;
  position: relative;
}

/* Ensure tags are full width on their own row */
.player-info .player-tags {
  width: 100%;
  margin-top: 8px;
}
</style>
