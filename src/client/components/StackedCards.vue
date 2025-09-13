<template>
  <div class="stacked-cards-container" ref="root">
    <div class="stacked-columns" :style="{ gridTemplateColumns: columnTemplate }">
      <div v-for="(column, columnIndex) in columns" :key="columnIndex" class="stack-column">
        <div v-for="(card, cardIndex) in column" :key="card.name" 
             :class="['stack-card', cardIndex === 0 ? 'cards-stack-first' : 'cards-stack']">
          <Card :card="card" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">

import Vue from 'vue';
import Card from '@/client/components/card/Card.vue';
import {CardModel} from '@/common/models/CardModel';

export default Vue.extend({
  name: 'stacked-cards',
  props: {
    cards: {
      type: Array as () => Array<CardModel>,
      default: () => [],
    },
  },
  components: {
    Card,
  },
  data() {
    return {
      columns: [] as Array<Array<CardModel>>,
      columnTemplate: '1fr',
      resizeObserver: null as any,
      leftColumnHeight: 0,
    };
  },
  mounted() {
    this.calculateColumns();
    this.setupObservers();
  },
  beforeDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },
  watch: {
    cards: {
      handler() {
        this.debouncedCalculateColumns();
      },
      deep: true,
    },
  },
  methods: {
    setupObservers() {
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.debouncedCalculateColumns());
        this.resizeObserver.observe(this.$el);
        
        // Also observe the left column for height changes
        const leftColumn = document.querySelector('.other-player-left');
        if (leftColumn) {
          this.resizeObserver.observe(leftColumn);
        }
      } else {
        window.addEventListener('resize', this.debouncedCalculateColumns);
      }
    },
    debouncedCalculateColumns() {
      if ((this as any)._calculateTimeout) clearTimeout((this as any)._calculateTimeout);
      (this as any)._calculateTimeout = setTimeout(() => this.calculateColumns(), 100);
    },
    calculateColumns() {
      if (!this.cards || this.cards.length === 0) {
        this.columns = [];
        this.columnTemplate = '1fr';
        return;
      }

      // Get left column height for reference
      const leftColumn = document.querySelector('.other-player-left');
      const targetHeight = leftColumn 
        ? leftColumn.getBoundingClientRect().height * 0.9  // Use 90% of left column height
        : window.innerHeight * 0.5; // Fallback

      // Estimate card height (including negative margins for stacking)
      const estimatedCardHeight = 80; // Cards stack with significant overlap
      const maxCardsPerColumn = Math.max(1, Math.floor(targetHeight / estimatedCardHeight));

      // Distribute cards into columns
      const newColumns: Array<Array<CardModel>> = [];
      let currentColumn: Array<CardModel> = [];
      
      for (const card of this.cards) {
        if (currentColumn.length >= maxCardsPerColumn) {
          newColumns.push(currentColumn);
          currentColumn = [];
        }
        currentColumn.push(card);
      }
      
      if (currentColumn.length > 0) {
        newColumns.push(currentColumn);
      }

      this.columns = newColumns;
      
      // Set grid template for columns
      if (newColumns.length === 0) {
        this.columnTemplate = '1fr';
      } else {
        this.columnTemplate = Array(newColumns.length).fill('minmax(0, 1fr)').join(' ');
      }
    },
  },
});

</script>

<style scoped>
.stacked-cards-container {
  width: 100%;
}

.stacked-columns {
  display: grid;
  gap: 12px;
  align-items: flex-start;
}

.stack-column {
  display: block;
  position: relative;
}

.stack-card {
  position: relative;
}

.stack-card.cards-stack-first {
  z-index: 1;
}

.stack-card.cards-stack {
  z-index: 1;
}
</style>


