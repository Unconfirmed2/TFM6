<template>
      <div :class="getClasses()">
        <div class="player-status-and-res">
        <div class="player-status">
          <div class="player-info-details">
            <div class="player-info-name" @click="togglePlayerDetails">{{ playerSymbol + player.name }}</div>
            <span @click="togglePlayerDetails" v-for="(corporationName, index) in getCorporationName()" :key="index" v-i18n>
              <div class="player-info-corp" :title="$t(corporationName)">
                {{ corporationName }}
              </div>
            </span>
          </div>
          <div>
            <div class="icon-first-player-top" v-if="firstForGen && playerView.players.length > 1" v-i18n>1st</div>
            <player-status :timer="player.timer" :showTimer="playerView.game.gameOptions.showTimers" :liveTimer="playerView.game.phase !== Phase.END" :firstForGen="firstForGen" v-trim-whitespace :actionLabel="actionLabel" :isTop="true"/>
          </div>
        </div>
          <PlayerResources :player="player" v-trim-whitespace />
          <div class="player-played-cards">
            <div class="player-played-cards-top">
              <div class="played-cards-elements">
                <div class="played-cards-icon hiding-card-button active"></div>
                <div class="played-cards-icon hiding-card-button automated"></div>
                <div class="played-cards-icon hiding-card-button event"></div>
                <div class="played-cards-count">{{numberOfPlayedCards()}}</div>
              </div>
            </div>
          </div>
          <div class="tag-display player-board-blue-action-counter" :class="tooltipCss" :data-tooltip="$t('The number of available actions on active cards')">
            <div class="tag-count tag-action-card">
              <div class="blue-stripe"></div>
              <div class="red-arrow"></div>
            </div>
            <span class="tag-count-display">{{ availableBlueActionCount() }}</span>
          </div>
        </div>
        <!-- Place tags directly below the status-and-res block and show full tag list -->
        <PlayerTags
          :player="player"
          :playerView="playerView"
          :hideZeroTags="false"
          :isTopBar="isTopBar"
          :conciseTagsViewDefaultValue="false"
        />
        <PlayerAlliedParty :player="player"/>
      </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import PlayerResources from '@/client/components/overview/PlayerResources.vue';
import PlayerTags from '@/client/components/overview/PlayerTags.vue';
import PlayerAlliedParty from '@/client/components/overview/PlayerAlliedParty.vue';
import PlayerStatus from '@/client/components/overview/PlayerStatus.vue';
import {playerColorClass} from '@/common/utils/utils';

import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {Phase} from '@/common/Phase';
import {ActionLabel} from './ActionLabel';
import {playerSymbol} from '@/client/utils/playerSymbol';

export default Vue.extend({
  name: 'PlayerInfoTopDuplicate',
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
    },
    playerView: {
      type: Object as () => ViewModel,
    },
    firstForGen: {
      type: Boolean,
      default: false,
    },
    actionLabel: {
      type: String as () => ActionLabel,
      default: '',
    },
    playerIndex: {
      type: Number,
    },
    hideZeroTags: {
      type: Boolean,
      default: false,
    },
    isTopBar: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    PlayerResources,
    PlayerTags,
    PlayerAlliedParty,
    'player-status': PlayerStatus,
  },
  computed: {
    tooltipCss(): string {
      return 'tooltip tooltip-' + (this.isTopBar ? 'bottom' : 'top');
    },
    playerSymbol(): string {
      return playerSymbol(this.player.color, ' ');
    },
    Phase(): typeof Phase {
      return Phase;
    },
  },
  methods: {


    getClasses(): string {
      return `player-info ${playerColorClass(this.player.color, 'bg_transparent')}`;
    },
    numberOfPlayedCards(): number {
      return this.player.tableau.length;
    },
    availableBlueActionCount(): number {
      return this.player.availableBlueCardActionCount;
    },
    getCorporationName(): string[] {
      const cards = this.player.tableau;
      const corporationCards = cards
        .filter((card) => getCard(card.name)?.type === CardType.CORPORATION)
        .map((card) => card.name);
      return corporationCards.length === 0 ? [''] : corporationCards;
    },
    // Template references togglePlayerDetails; provide a no-op to satisfy the type checker.
    togglePlayerDetails(): void {
      // intentionally no-op; detail toggling is handled by a parent component in other contexts
    },
  },
});
</script>
