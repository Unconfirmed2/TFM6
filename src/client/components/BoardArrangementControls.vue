<template>
  <div class="board-arrangement-controls">
    <div class="arrangement-header">
      <h4>Board Layout</h4>
      <button class="btn btn-sm toggle-controls" @click="showControls = !showControls">
        {{ showControls ? 'Hide' : 'Show' }} Controls
      </button>
    </div>
    
    <div v-show="showControls" class="arrangement-content">
      <!-- Drag and Drop Area for Board Elements -->
      <div class="arrangement-section">
        <h5>Arrange Sections</h5>
        <div class="draggable-elements">
          <div 
            v-for="element in boardElements" 
            :key="element.key"
            :ref="'draggable-' + element.key"
            class="draggable-element"
            :class="{ 'dragging': draggedElement === element.key }"
            draggable="true"
            @dragstart="onDragStart(element.key)"
            @dragend="onDragEnd()"
            @dragover.prevent="onDragOver"
            @drop="onDrop(element.key)"
          >
            <div class="element-icon">{{ element.icon }}</div>
            <div class="element-name">{{ element.name }}</div>
          </div>
        </div>
      </div>
      
      <!-- Visibility Toggles -->
      <div class="visibility-section">
        <h5>Show/Hide Sections</h5>
        <div class="toggle-grid">
          <label v-for="element in boardElements" :key="element.key" class="toggle-item">
            <input 
              type="checkbox" 
              :checked="element.visible"
              @change="toggleVisibility(element.key)"
            />
            <span class="toggle-label">{{ element.name }}</span>
          </label>
        </div>
      </div>
      
      <!-- Player Overview Sticky Toggle -->
      <div class="sticky-section">
        <h5>Player Overview</h5>
        <label class="toggle-item">
          <input 
            type="checkbox" 
            :checked="playerOverviewSticky"
            @change="togglePlayerOverviewSticky"
          />
          <span class="toggle-label">Sticky Player Overview</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {getPreferences, PreferencesManager} from '@/client/utils/PreferencesManager';

interface BoardElement {
  key: string;
  name: string;
  icon: string;
  visible: boolean;
}

export default Vue.extend({
  name: 'BoardArrangementControls',
  data() {
    const preferences = getPreferences();
    
    return {
      showControls: false,
      draggedElement: null as string | null,
      boardElements: [
        { key: 'board', name: 'Map', icon: '🗺️', visible: preferences.show_board },
        { key: 'actions', name: 'Actions', icon: '⚡', visible: preferences.show_actions },
        { key: 'cards', name: 'Cards', icon: '🃏', visible: preferences.show_cards },
        { key: 'colonies', name: 'Colonies', icon: '🏛️', visible: preferences.show_colonies },
        { key: 'players_overview', name: 'Players', icon: '👥', visible: preferences.show_players_overview },
      ] as BoardElement[],
      playerOverviewSticky: preferences.player_overview_sticky,
    };
  },
  watch: {
    boardElements: {
      deep: true,
      handler() {
        this.saveElementOrder();
        this.saveVisibilityPreferences();
      },
    },
    playerOverviewSticky() {
      PreferencesManager.INSTANCE.set('player_overview_sticky', this.playerOverviewSticky);
      this.$emit('sticky-changed', this.playerOverviewSticky);
    },
  },
  mounted() {
    // Initialize element order from preferences
    this.initializeElementOrder();
  },
  methods: {
    initializeElementOrder() {
      const preferences = getPreferences();
      const savedOrder = preferences.board_element_order.split(',');
      
      // Reorder boardElements based on saved order
      const orderedElements: BoardElement[] = [];
      for (const key of savedOrder) {
        const element = this.boardElements.find(el => el.key === key);
        if (element) {
          orderedElements.push(element);
        }
      }
      
      // Add any missing elements (in case new ones were added)
      for (const element of this.boardElements) {
        if (!orderedElements.find(el => el.key === element.key)) {
          orderedElements.push(element);
        }
      }
      
      this.boardElements = orderedElements;
    },
    
    onDragStart(elementKey: string) {
      this.draggedElement = elementKey;
    },
    
    onDragEnd() {
      this.draggedElement = null;
    },
    
    onDragOver(event: DragEvent) {
      event.preventDefault();
    },
    
    onDrop(targetElementKey: string) {
      if (!this.draggedElement || this.draggedElement === targetElementKey) {
        return;
      }
      
      // Find indices
      const draggedIndex = this.boardElements.findIndex(el => el.key === this.draggedElement);
      const targetIndex = this.boardElements.findIndex(el => el.key === targetElementKey);
      
      if (draggedIndex === -1 || targetIndex === -1) {
        return;
      }
      
      // Reorder elements
      const newElements = [...this.boardElements];
      const [draggedElement] = newElements.splice(draggedIndex, 1);
      newElements.splice(targetIndex, 0, draggedElement);
      
      this.boardElements = newElements;
      this.saveElementOrder();
      
      // Emit event to parent to trigger re-render
      this.$emit('arrangement-changed', this.getElementOrder());
    },
    
    toggleVisibility(elementKey: string) {
      const element = this.boardElements.find(el => el.key === elementKey);
      if (element) {
        element.visible = !element.visible;
        this.saveVisibilityPreferences();
        this.$emit('visibility-changed', elementKey, element.visible);
      }
    },
    
    togglePlayerOverviewSticky() {
      this.playerOverviewSticky = !this.playerOverviewSticky;
    },
    
    saveElementOrder() {
      const order = this.boardElements.map(el => el.key).join(',');
      PreferencesManager.INSTANCE.set('board_element_order', order);
    },
    
    saveVisibilityPreferences() {
      for (const element of this.boardElements) {
        const prefKey = `show_${element.key}` as keyof typeof getPreferences;
        PreferencesManager.INSTANCE.set(prefKey as any, element.visible);
      }
    },
    
    getElementOrder(): string[] {
      return this.boardElements.map(el => el.key);
    },
    
    getVisibilityState(): Record<string, boolean> {
      const state: Record<string, boolean> = {};
      for (const element of this.boardElements) {
        state[element.key] = element.visible;
      }
      return state;
    },
  },
});
</script>

<style scoped>
.board-arrangement-controls {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin: 10px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.arrangement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.arrangement-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: bold;
}

.toggle-controls {
  font-size: 12px;
  padding: 4px 8px;
}

.arrangement-content {
  border-top: 1px solid #eee;
  padding-top: 10px;
}

.arrangement-section, .visibility-section, .sticky-section {
  margin-bottom: 15px;
}

.arrangement-section h5, .visibility-section h5, .sticky-section h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: bold;
  color: #666;
}

.draggable-elements {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.draggable-element {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: move;
  user-select: none;
  transition: all 0.2s ease;
  font-size: 12px;
}

.draggable-element:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.draggable-element.dragging {
  opacity: 0.5;
  transform: rotate(5deg);
}

.element-icon {
  font-size: 14px;
}

.element-name {
  font-weight: 500;
}

.toggle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.toggle-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
}

.toggle-item input[type="checkbox"] {
  margin: 0;
}

.toggle-label {
  user-select: none;
}
</style>