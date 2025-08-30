<template>
  <div v-show="isVisible()">
    <div :class="'player_translucent_bg_color_' + player.color" class="other_player_header">
      <div class="player_name">{{ player.name }} <span v-i18n>played cards</span></div>
      <AppButton size="big" type="close" @click="hideMe" :disableOnServerBusy="false" align="right" />
    </div>
  <div class="other_player_cont menu">
    <div class="other-player-controls">
      <label v-i18n for="card-filter">Filter:</label>
      <select id="card-filter" v-model="activeFilter">
        <option value="all">All</option>
        <option value="corporation">Corporation</option>
        <option value="prelude">Prelude</option>
        <option value="ceo">CEO</option>
        <option value="active_with_actions">Active (with actions)</option>
        <option value="active_without_actions">Active (without actions)</option>
        <option value="automated">Automated</option>
        <option value="event">Events</option>
        <option value="self_replicating">Self-replicating Robots</option>
      </select>
    </div>
    <div v-if="hasAnyCards" class="player_home_block other-player-columns">
      <div class="other-player-left">
        <card-group
          v-for="key in ['corporation','prelude','ceo']"
          :key="key"
          :title="groupTitle(key)"
          :cards="getGroupCards(key)"
          :mode="groupDisplayModes[key]"
          :small="true"
          :visible="getGroupCards(key).length > 0 && groupDisplayModes[key] !== 'hidden' && activeFilterMatches(key)"
          :player="player"
          @change-mode="setMode(key, $event)
        "></card-group>
      </div>
      <div class="other-player-right">
        <card-group
          v-for="key in ['active_with_actions','active_without_actions','automated','event','self_replicating']"
          :key="key"
          :title="groupTitle(key)"
          :cards="getGroupCards(key)"
          :mode="groupDisplayModes[key]"
          :small="false"
          :visible="getGroupCards(key).length > 0 && groupDisplayModes[key] !== 'hidden' && activeFilterMatches(key)"
          :player="player"
          @change-mode="setMode(key, $event)
        "></card-group>
      </div>
    </div>
    <div v-if="player.selfReplicatingRobotsCards.length > 0 && activeFilterMatches('self_replicating')" class="player_home_block">
      <span v-i18n>Self-replicating Robots cards</span>
      <div>
        <div v-for="card in player.selfReplicatingRobotsCards" :key="card.name" class="cardbox">
          <Card :card="card" />
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script lang="ts">

import Vue from 'vue';

import StackedCards from '@/client/components/StackedCards.vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {vueRoot} from '@/client/components/vueRoot';
import Card from '@/client/components/card/Card.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import CardGroup from '@/client/components/overview/CardGroup.vue';
import {CardType} from '@/common/cards/CardType';
import {getCardsByType, isCardActivated} from '@/client/utils/CardUtils';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';

export default Vue.extend({
  name: 'OtherPlayer',
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
    },
    playerIndex: {
      type: Number,
    },
  },
  components: {
    AppButton,
    'stacked-cards': StackedCards,
    Card,
  'card-group': CardGroup,
  },
  data() {
    return {
      activeFilter: 'all',
      groupOrder: [
        'corporation',
        'prelude',
        'ceo',
        'active_with_actions',
        'active_without_actions',
        'automated',
        'event',
        'self_replicating',
      ] as string[],
      groupDisplayModes: {
        corporation: 'grid',
        prelude: 'grid',
        ceo: 'grid',
        active_with_actions: 'grid',
        active_without_actions: 'grid',
        automated: 'stacked',
        event: 'hidden',
        self_replicating: 'stacked',
      } as {[k: string]: string},
    };
  },
  methods: {
    hideMe() {
      vueRoot(this).setVisibilityState('pinned_player_' + this.playerIndex, false);
    },
    isVisible() {
      const root: any = vueRoot(this);
      const key = 'pinned_player_' + this.playerIndex;
      // If the visibility key hasn't been set yet, default to visible.
      if (!root || !root.componentsVisibility || !(key in root.componentsVisibility)) {
        return true;
      }
      return root.getVisibilityState(key);
    },
    setMode(groupKey: string, mode: string) {
      this.groupDisplayModes[groupKey] = mode;
    },
    getGroupCards(groupKey: string) {
      const t = this.player.tableau || [];
      switch (groupKey) {
        case 'corporation':
          return this.getCardsByType(t, [CardType.CORPORATION]);
        case 'prelude':
          return this.getCardsByType(t, [CardType.PRELUDE]);
        case 'ceo':
          return this.getCardsByType(t, [CardType.CEO]);
        case 'active_with_actions':
          return this.sortActiveCards(this.getCardsByType(t, [CardType.ACTIVE])).filter((c: any) => this.isCardActivated(c, this.player));
        case 'active_without_actions':
          return this.sortActiveCards(this.getCardsByType(t, [CardType.ACTIVE])).filter((c: any) => !this.isCardActivated(c, this.player));
        case 'automated':
          return this.getCardsByType(t, [CardType.AUTOMATED]);
        case 'event':
          return this.getCardsByType(t, [CardType.EVENT]);
        case 'self_replicating':
          return this.player.selfReplicatingRobotsCards || [];
        default:
          return [];
      }
    },
    groupTitle(key: string) {
      const titles: {[k: string]: string} = {
        corporation: this.$t('Corporation') as string,
        prelude: this.$t('Prelude') as string,
        ceo: this.$t('CEO') as string,
        active_with_actions: this.$t('Active (with actions)') as string,
        active_without_actions: this.$t('Active (without actions)') as string,
        automated: this.$t('Automated') as string,
        event: this.$t('Events') as string,
        self_replicating: this.$t('Self-replicating Robots') as string,
      };
      return titles[key] || key;
    },
    showGroup(groupKey: string) {
      if (!this.activeFilter || this.activeFilter === 'all') return this.getGroupCards(groupKey).length > 0 && this.groupDisplayModes[groupKey] !== 'hidden';
      if (this.activeFilter === groupKey) return this.getGroupCards(groupKey).length > 0 && this.groupDisplayModes[groupKey] !== 'hidden';
      return false;
    },
    activeFilterMatches(groupKey: string) {
      return !this.activeFilter || this.activeFilter === 'all' || this.activeFilter === groupKey;
    },
  },
  computed: {
    CardType(): typeof CardType {
      return CardType;
    },
    getCardsByType(): typeof getCardsByType {
      return getCardsByType;
    },
    isCardActivated(): typeof isCardActivated {
      return isCardActivated;
    },
    sortActiveCards(): typeof sortActiveCards {
      return sortActiveCards;
    },
    hasAnyCards(): boolean {
      // Return true if any configured group has cards that match the active filter
      for (let i = 0; i < this.groupOrder.length; i++) {
        const g = this.groupOrder[i];
        const cards = this.getGroupCards(g) || [];
        if (cards.length === 0) continue;
        if (this.groupDisplayModes[g] === 'hidden') continue;
        if (this.activeFilter && this.activeFilter !== 'all' && this.activeFilter !== g) continue;
        return true;
      }
      return false;
    },
  },
});
</script>

<style scoped>
.other-player-columns { display: flex; gap: 12px; align-items:flex-start; }
.other-player-left { flex: 0 0 320px; display:flex; flex-direction:column; gap:8px; }
.other-player-right { flex: 1 1 auto; display:flex; gap:12px; flex-wrap:wrap; }
.other-player-right .card-group-wrapper { flex: 0 0 220px; }
.other-player-left .card-group-wrapper { width:100%; }
.card-group-wrapper { background: rgba(0,0,0,0.15); padding:8px; border-radius:4px; }
.group-cards.grid-layout { display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; }
.group-cards.grid-layout .cardbox { margin:4px; }
.group-cards.grid-small { display:grid; grid-template-columns: 1fr; gap:6px; }

</style>
