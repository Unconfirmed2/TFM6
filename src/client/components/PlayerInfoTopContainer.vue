<template>
  <div class="player-info-top-container">
    <PlayerInfoTopDuplicate
      v-for="(p, idx) in playerView.players"
      :key="p.color + '-' + idx"
      :player="p"
      :playerView="playerView"
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
});
</script>

<style scoped>
.player-info-top-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

/* Make each player-info card a vertical column so tags sit below status */
.player-info-top-container > .player-info {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-width: 220px;
}

/* Ensure tags are full width on their own row */
.player-info .player-tags {
  width: 100%;
  margin-top: 8px;
}
</style>
