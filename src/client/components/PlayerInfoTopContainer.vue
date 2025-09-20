<template>
  <div :class="['player-info-top-container', { 'player-info-top-container--sticky': isHeaderSticky }]">
    <div
      v-for="(p, idx) in getPlayersInOrder()"
      :key="p.color + '-' + idx"
      class="player-info-item"
    >
      <PlayerInfoTopDuplicate
        :player="p"
        :playerView="playerView"
        :playerIndex="idx"
        :hideZeroTags="false"
        :isTopBar="true"
        :firstForGen="getIsFirstForGen(p)"
        :actionLabel="getActionLabel(p)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import PlayerInfoTopDuplicate from '@/client/components/overview/PlayerInfoTopDuplicate.vue';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {getPlayersInOrder, isFirstForGen, playerIndex} from '@/client/components/overview/playerHelpers';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import {Phase} from '@/common/Phase';

const SHOW_NEXT_LABEL_MIN = 2;

export default Vue.extend({
  name: 'player-info-top-container',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
    },
  },
  components: {
    PlayerInfoTopDuplicate,
  },
  computed: {
    players(): Array<PublicPlayerModel> {
      return this.playerView.players;
    },
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    isHeaderSticky(): boolean {
      try {
        return !!getPreferences().header_sticky;
      } catch (e) {
        return false;
      }
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

.player-info-top-container.player-info-top-container--sticky {
  display: inline-flex;
  background-color: black;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  position: sticky;
  top: -13px;
  z-index: 20;
}

/* Wrapper with fixed dimensions for the player info area */
/* Each player gets its own fixed-size container */
.player-info-item {
  width: 660px;
  height: 160px;
  box-sizing: border-box;
  overflow: hidden;
  padding-left:5px;
}
/* Make each player-info card a vertical column so tags sit below status */
.player-info-item .player-info,
.player-info-top-container > .player-info {
  display: inline-flex;
  position: relative; /* create containing block for absolutely positioned badge */
  flex-direction: column;
  align-items: stretch;
  /* Visually scale player info to 75% and adjust layout min-width accordingly */
  transform: scale(0.75);
  transform-origin: top left;
}

/* Ensure tags are full width on their own row */
.player-info .player-tags {
  width: 100%;
  margin-top: 8px;
}
</style>
