<template>
  <div class="player-info-top-container">
    <PlayerInfoTopDuplicate
      v-for="(p, idx) in getPlayersInOrder()"
      :key="p.color + '-' + idx"
      :player="p"
      :playerView="playerView"
      :playerIndex="idx"
      :hideZeroTags="false"
      :isTopBar="true"
      :firstForGen="getIsFirstForGen(p)"
      :actionLabel="getActionLabel(p)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import PlayerInfo from '@/client/components/overview/PlayerInfo.vue';
import PlayerInfoTopDuplicate from '@/client/components/overview/PlayerInfoTopDuplicate.vue';
import { getPlayersInOrder, isFirstForGen, playerIndex } from '@/client/components/overview/playerHelpers';
import { PlayerViewModel, PublicPlayerModel } from '@/common/models/PlayerModel';
import { ActionLabel } from '@/client/components/overview/ActionLabel';
import { Phase } from '@/common/Phase';

const SHOW_NEXT_LABEL_MIN = 2;

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
    players(): Array<PublicPlayerModel> {
      return this.playerView.players;
    },
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
  },
  methods: {
    // Match PlayersOverview.getIsFirstForGen: first player in the players array
    getIsFirstForGen(player: any): boolean {
      return isFirstForGen(player, this.playerView.players);
    },
    // Mirror PlayersOverview.getPlayersInOrder rotation so current player is first
    getPlayersInOrder(): Array<any> {
      return getPlayersInOrder(this.playerView.players, this.playerView.thisPlayer);
    },
    // Copy getActionLabel logic from PlayersOverview
    getActionLabel(player: PublicPlayerModel): ActionLabel {
      if (this.playerView.game.phase === Phase.DRAFTING) {
        if (player.needsToDraft) {
          return 'drafting';
        } else {
          return 'none';
        }
      } else if (this.playerView.game.phase === Phase.RESEARCH) {
        if (player.needsToResearch) {
          return 'researching';
        } else {
          return 'none';
        }
      }
      if (this.playerView.game.passedPlayers.includes(player.color)) {
        return 'passed';
      }
      if (player.isActive) return 'active';
      const notPassedPlayers = this.players.filter(
        (p: PublicPlayerModel) => !this.playerView.game.passedPlayers.includes(p.color),
      );

      const currentPlayerIndex = playerIndex(
        player.color,
        notPassedPlayers,
      );

      if (currentPlayerIndex === -1) {
        return 'none';
      }

      const prevPlayerIndex =
                currentPlayerIndex === 0 ?
                  notPassedPlayers.length - 1 :
                  currentPlayerIndex - 1;
      const isNext = notPassedPlayers[prevPlayerIndex].isActive;

      if (isNext && this.players.length > SHOW_NEXT_LABEL_MIN) {
        return 'next';
      }

      return 'none';
    },
  },
});
</script>

<style scoped>
.player-info-top-container {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  
}

/* Make each player-info card a vertical column so tags sit below status */
.player-info-top-container > .player-info {
  display: flex;
  position: relative; /* create containing block for absolutely positioned badge */
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
