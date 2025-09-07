<template>
  <div v-show="isVisible()">
    <div :class="'player_translucent_bg_color_' + player.color" class="other_player_header">
      <div class="player_name">{{ player.name }} <span v-i18n>played cards</span></div>
      <div class="header-filter">
        <select v-model="activeFilter">
          <option v-for="opt in filterOptions" :key="opt.key" :value="opt.key">{{ opt.title }}</option>
        </select>
      </div>
    </div>
  <div class="other_player_cont menu">
    <!-- full-width selected group (single-column) -->
    <div v-if="activeFilter && activeFilter !== 'all' && getGroupCards(activeFilter).length > 0" class="full-width-row">
      <card-group
        :key="activeFilter"
        :group-key="activeFilter"
        :title="groupTitle(activeFilter)"
        :cards="getGroupCards(activeFilter)"
        :mode="groupDisplayModes[activeFilter]"
        :small="false"
        :visible="groupDisplayModes[activeFilter] !== 'hidden'"
        :player="player"
        :full-width="true"
        @change-mode="setMode(activeFilter, $event)"
      ></card-group>
    </div>
    <div v-if="hasAnyCards" class="player_home_block other-player-columns">
      <div class="other-player-left">
  <div v-if="hiddenGroups.length > 0" class="hidden-groups">
          <card-group
            v-for="key in hiddenGroups"
            :key="key"
            :group-key="key"
            :title="groupTitle(key)"
            :cards="getGroupCards(key)"
            :mode="groupDisplayModes[key]"
            :small="true"
            :visible="true"
            :player="player"
            :header-only="true"
            :full-width="activeFilter === key"
            @change-mode="setMode(key, $event)
          "></card-group>
          <div v-if="hiddenGroups.length === groupOrder.length" class="unhide-all">
            <AppButton size="small" @click="unhideAll">Unhide all</AppButton>
          </div>
        </div>
        <card-group
          v-for="key in ['corporation','prelude','ceo']"
          :key="key"
          :group-key="key"
          :title="groupTitle(key)"
          :cards="getGroupCards(key)"
          :mode="groupDisplayModes[key]"
          :small="true"
          :visible="getGroupCards(key).length > 0 && groupDisplayModes[key] !== 'hidden' && activeFilterMatches(key) && key !== activeFilter"
          :player="player"
          :full-width="activeFilter === key"
          @change-mode="setMode(key, $event)
        "></card-group>
      </div>
      <div class="other-player-right">
        <card-group
          v-for="key in ['active_with_actions','active_without_actions','automated','event','self_replicating']"
          :key="key"
          :group-key="key"
          :title="groupTitle(key)"
          :cards="getGroupCards(key)"
          :mode="groupDisplayModes[key]"
          :small="false"
          :visible="getGroupCards(key).length > 0 && groupDisplayModes[key] !== 'hidden' && activeFilterMatches(key) && key !== activeFilter"
          :player="player"
          :full-width="activeFilter === key"
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
    defaultModes() {
      return {
        corporation: 'grid',
        prelude: 'grid',
        ceo: 'grid',
        active_with_actions: 'grid',
        active_without_actions: 'grid',
        automated: 'stacked',
        event: 'hidden',
        self_replicating: 'stacked',
      } as {[k: string]: string};
    },
    unhideAll() {
      this.groupDisplayModes = this.defaultModes();
      this.activeFilter = 'all';
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
        active_with_actions: this.$t('Actions') as string,
        active_without_actions: this.$t('Active') as string,
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
  watch: {
    activeFilter(newVal: string) {
      // If filter is 'all' or cleared, restore default display modes
      if (!newVal || newVal === 'all') {
        this.groupDisplayModes = this.defaultModes();
        return;
      }

      // If the selected group has no cards, ignore the filter change
      if (this.getGroupCards(newVal).length === 0) return;

      // Otherwise, set the selected group to grid and hide all others
      for (let i = 0; i < this.groupOrder.length; i++) {
        const k = this.groupOrder[i];
        if (k === newVal) {
          this.groupDisplayModes[k] = 'grid';
        } else {
          this.groupDisplayModes[k] = 'hidden';
        }
      }
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
    hiddenGroups(): string[] {
      return this.groupOrder.filter((k) => this.groupDisplayModes[k] === 'hidden' && this.getGroupCards(k).length > 0 && this.activeFilterMatches(k));
    },
    filterOptions() {
      const opts: Array<{key:string, title:string}> = [{key: 'all', title: this.$t('All') as string}];
      for (let i = 0; i < this.groupOrder.length; i++) {
        const k = this.groupOrder[i];
        const cards = this.getGroupCards(k) || [];
        if (cards.length > 0) {
          opts.push({key: k, title: this.groupTitle(k)});
        }
      }
      return opts;
    },
  },
});
</script>

<style scoped>
.other-player-columns { display: flex; gap: 12px; align-items:flex-start; }
.other-player-left { flex: 0 0 320px; display:flex; flex-direction:column; gap:8px; }
.other-player-right { flex: 1 1 auto; display:flex; gap:12px; flex-wrap:wrap; align-content:flex-start; }
.other-player-right .card-group-wrapper { flex: 1 1 220px; min-width:220px; }
.other-player-left .card-group-wrapper { width:100%; }
 .card-group-wrapper { background: transparent; padding:8px; border-radius:4px; }
.group-cards.grid-layout { display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; }
.group-cards.grid-layout .cardbox { margin:4px; }
.group-cards.grid-small { display:grid; grid-template-columns: 1fr; gap:6px; }

.hidden-groups { display:flex; flex-direction:column; gap:6px; }
.hidden-groups .unhide-all { margin-top:6px; display:flex; justify-content:flex-end; }
.card-group-wrapper.full-width { width:100%; }

.full-width-row { width:100%; margin:8px 0; }
.card-group-wrapper { transition: opacity 200ms ease, transform 200ms ease; }
.card-group-wrapper[style*="display: none"] { opacity: 0; transform: translateY(-8px); }

</style>
