<template>
  <div v-show="visible" class="card-group-wrapper">
    <div :class="['group-header', groupKey ? 'group-header-' + groupKey : '']">
      <span class="group-title">{{ title }}</span>
      <span class="group-count">({{ cards.length }})</span>
      <select class="group-mode-select" v-model="localMode" @change="onModeChange">
        <option value="grid">Grid</option>
        <option value="stacked">Stacked</option>
        <option value="hidden">Hidden</option>
      </select>
    </div>
    <div v-if="!headerOnly" :class="{ 'full-width': fullWidth }">
  <div v-if="localMode === 'grid'" :class="['group-cards', small ? 'grid-small' : (fullWidth ? 'grid-one' : 'grid-two')]">
        <div v-for="(card, idx) in typedCards" :key="card && card.name ? card.name : idx" class="cardbox">
          <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
        </div>
      </div>

      <div v-else-if="localMode === 'stacked'">
        <stacked-cards :cards="cards" :player="player" />
      </div>
    </div>
    <!-- hidden -> render nothing -->
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import StackedCards from '@/client/components/StackedCards.vue';
import Card from '@/client/components/card/Card.vue';
import {isCardActivated} from '@/client/utils/CardUtils';

export default Vue.extend({
  name: 'CardGroup',
  props: {
    title: {type: String, required: true},
    cards: {type: Array as () => Array<{name?: string}>, required: true},
    mode: {type: String, default: 'grid'},
    small: {type: Boolean, default: false},
    visible: {type: Boolean, default: true},
    player: {type: Object, required: true},
    groupKey: {type: String, default: ''},
    headerOnly: {type: Boolean, default: false},
    fullWidth: {type: Boolean, default: false},
  },
  components: {'stacked-cards': StackedCards, Card},
  data() {
    return {
      localMode: this.mode,
    } as any;
  },
  computed: {
    typedCards(): Array<{name?: string}> {
      return (this.cards as Array<{name?: string}>) || [];
    },
  },
  watch: {
    mode(v: string) {
      this.localMode = v;
    },
  },
  methods: {
    onModeChange() {
      this.$emit('change-mode', this.localMode);
    },
    isCardActivated,
  },
});
</script>

<style scoped>
.group-header { display:flex; align-items:stretch; gap:8px; margin:6px 0;flex-direction:row;flex-wrap:nowrap; }
.group-title { font-weight:600; }
.group-count { color: #ccc; }
.group-mode-select { margin-left:auto; }
.group-cards.grid-two { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; align-items:flex-start; }
.group-cards.grid-one { display:grid; grid-template-columns: 1fr; gap:8px; }
.group-cards.grid-small { display:flex; flex-direction:column; gap:6px; }
.cardbox { margin:4px; flex: 0 0 180px; }

 
.full-width { width: 100%; }

/* Header color theming */
.group-header { padding:6px; border-radius:4px; color: #000; }
.group-header .group-title, .group-header .group-count { color: #000; }
/* 15% darker hex shades */
.group-header-corporation, .group-header-ceo, .group-header-event, .group-header-self_replicating { background: #bfbfbf; }
.group-header-automated { background: #c7e9cf; }
.group-header-active_with_actions, .group-header-active_without_actions { background: #9fc6ff; }
.group-header-prelude { background: #ffc0d6; }
</style>
