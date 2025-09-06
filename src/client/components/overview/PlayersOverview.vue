<template>
        <div class="players-overview" v-if="hasPlayers()">
            <overview-settings />
            <div v-for="(p, index) in getPlayersInOrder()" :key="p.color">
              <player-info
                :player="p"
                :playerView="playerView"
                :firstForGen="getIsFirstForGen(p)"
                :actionLabel="getActionLabel(p)"
                :playerIndex="index"/>
              <other-player :player="p" :playerIndex="index" />
            </div>
        </div>
</template>

<script lang="ts">
import Vue from 'vue';
import PlayerInfo from '@/client/components/overview/PlayerInfo.vue';
import OverviewSettings from '@/client/components/overview/OverviewSettings.vue';
import OtherPlayer from '@/client/components/OtherPlayer.vue';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {playerIndex, getPlayersInOrder} from '@/client/components/overview/playerHelpers';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import {Phase} from '@/common/Phase';

const SHOW_NEXT_LABEL_MIN = 2;

// Use shared helper functions in playerHelpers

export default Vue.extend({
  name: 'PlayersOverview',
  props: {
    playerView: {
      type: Object as () => ViewModel,
    },
  },
  computed: {
    players(): Array<PublicPlayerModel> {
      return this.playerView.players;
    },
    thisPlayer(): PublicPlayerModel | undefined {
      return this.playerView.thisPlayer;
    },
  },
  components: {
    'player-info': PlayerInfo,
    'overview-settings': OverviewSettings,
    'other-player': OtherPlayer,
  },
  data() {
    return {};
  },
  methods: {
    hasPlayers(): boolean {
      return this.players.length > 0;
    },
    getIsFirstForGen(player: PublicPlayerModel): boolean {
      return playerIndex(player.color, this.players) === 0;
    },
    getPlayersInOrder(): Array<PublicPlayerModel> {
      return getPlayersInOrder(this.players, this.thisPlayer);
    },
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
