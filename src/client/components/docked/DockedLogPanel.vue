
<template>
  <div :class="['docked-log-panel', { 'card-open': cardPanelVisible }]">
    <div class="docked-log-controls">
    </div>

    <!-- Render a fresh LogPanel instance so this is a true duplication -->
    <log-panel
      :id="id"
      :players="players"
      :generation="selectedGeneration"
      :lastSoloGeneration="lastSoloGeneration"
      :color="color"
      :step="step"
      :externalCardPanel="true"
      @card-panel-visible="cardPanelVisible = $event"
      @selected-message="selectedMessage = $event"
    />
    <!-- Render CardPanel externally so it sits in the dock wrapper -->
    <card-panel v-if="selectedMessage" :message="selectedMessage" :players="players" v-on:hide="onHideCardPanel"></card-panel>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import CardPanel from '@/client/components/logpanel/CardPanel.vue';

export default Vue.extend({
  name: 'docked-log-panel',
  components: { 'log-panel': LogPanel, 'card-panel': CardPanel },
  props: {
    id: { type: String, required: false },
    players: { type: Array, required: true },
    generation: { type: Number, required: true },
    lastSoloGeneration: { type: Number, required: false },
    color: { type: String, required: false },
    step: { type: Number, required: false },
  },
  data() {
    return {
      selectedGeneration: this.generation || 1,
      cardPanelVisible: false,
      selectedMessage: undefined,
    };
  },
  methods: {
    onHideCardPanel() {
      this.selectedMessage = undefined;
      this.cardPanelVisible = false;
    },
  },
  computed: {
    generationRange(): number[] {
      const max = this.generation || 1;
      const arr: number[] = [];
      for (let i = 1; i <= max; i++) arr.push(i);
      return arr;
    },
  },
  watch: {
    // Keep initial prop changes in sync (if parent updates generation externally)
    generation(newVal: number) {
      if (newVal && newVal !== this.selectedGeneration) {
        this.selectedGeneration = newVal;
      }
    },
  },
});
</script>

<style scoped>
.docked-log-panel { width: 100%; box-sizing: border-box; }
.docked-log-controls { padding: 6px 8px; background: transparent; display: flex; align-items: center; }
.docked-log-controls select { width: 100%; padding: 6px; border-radius: 3px; border: 1px solid #444; background: #222; color: #ddd; }
.visually-hidden { position: absolute !important; height: 1px; width: 1px; overflow: hidden; clip: rect(1px,1px,1px,1px); white-space: nowrap; }
</style>
