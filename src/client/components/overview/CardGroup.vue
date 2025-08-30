<template>
  <div v-if="visible" class="card-group-wrapper">
    <div class="group-header">
      <span class="group-title">{{ title }}</span>
      <span class="group-count">({{ cards.length }})</span>
      <select class="group-mode-select" v-model="localMode" @change="onModeChange">
        <option value="grid">Grid</option>
        <option value="stacked">Stacked</option>
        <option value="hidden">Hidden</option>
      </select>
    </div>

    <div v-if="localMode === 'grid'" :class="['group-cards', small ? 'grid-small' : 'grid-two']">
      <div v-for="card in cards" :key="card.name" class="cardbox">
        <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color"/>
      </div>
    </div>

    <div v-else-if="localMode === 'stacked'">
      <stacked-cards :cards="cards" :player="player" />
    </div>
    <!-- hidden -> render nothing -->
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import StackedCards from '@/client/components/StackedCards.vue';
import Card from '@/client/components/card/Card.vue';
import { isCardActivated } from '@/client/utils/CardUtils';

export default Vue.extend({
  name: 'CardGroup',
  props: {
    title: { type: String, required: true },
    cards: { type: Array as () => any[], required: true },
    mode: { type: String, default: 'grid' },
    small: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
    player: { type: Object, required: true },
  },
  components: { 'stacked-cards': StackedCards, Card },
  data() {
    return {
      localMode: this.mode,
    } as any;
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
.group-header { display:flex; align-items:center; gap:8px; margin:6px 0; }
.group-title { font-weight:600; }
.group-count { color: #ccc; }
.group-mode-select { margin-left:auto; }
.group-cards.grid-two { display:grid; grid-template-columns: repeat(2, 1fr); gap:8px; }
.group-cards.grid-small { display:grid; grid-template-columns: 1fr; gap:6px; }
.cardbox { margin:4px; }
</style>
