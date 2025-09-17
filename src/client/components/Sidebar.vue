<template>
<div :class="'sidebar_cont sidebar '+getSideBarClass()">
  <div class="tm" @click="toggleGlobalParams" :title="$t('Generation Marker (click for global parameters)')" style="cursor: pointer;">
    <div class="gen-text" v-i18n>GEN</div>
    <div class="gen-marker">{{ getGenMarker() }}</div>
  </div>

  <!-- Chat icon placed first in the sidebar (hidden when right_chat_log is enabled) -->
  <div v-if="!getPreferences().right_chat_log" class="sidebar_item sidebar_item_shortcut draggable-section" :title="getSectionTitle(6)"
       @click.prevent="toggleChat" draggable="false" role="button" :aria-pressed="chatVisible.toString()">
    <i class="sidebar_icon sidebar_icon--chat"></i>
    <div v-if="!chatVisible && unreadMessageCount > 0" class="unread-badge">
      {{ unreadMessageCount > 99 ? '99+' : unreadMessageCount }}
    </div>
  </div>
  
  <!-- Global Parameters Popup -->
  <div v-if="globalParamsOpen" class="global-params-popup">
    <global-parameter-value :param="this.globalParameter.TEMPERATURE" :value="this.temperature"></global-parameter-value>
    <global-parameter-value :param="this.globalParameter.OXYGEN" :value="this.oxygen"></global-parameter-value>
    <global-parameter-value :param="this.globalParameter.OCEANS" :value="this.oceans"></global-parameter-value>
    <global-parameter-value v-if="gameOptions.expansions.venus" :param="this.globalParameter.VENUS" :value="this.venus"></global-parameter-value>
    <MoonGlobalParameterValue v-if="gameOptions.expansions.moon" :moonData="this.moonData"></MoonGlobalParameterValue>
  </div>

  <div v-if="gameOptions.expansions.turmoil" :title="$t('Ruling Party')">
    <div :class="'party-name party-name-indicator party-name--'+rulingPartyToCss()"> <span v-i18n>{{ getRulingParty() }}</span></div>
  </div>
  
  <!-- Dynamic sidebar icons based on section order -->
  <template v-for="sectionId in sectionOrder" :key="sectionId">
    <template v-if="shouldShowSection(sectionId) && sectionId !== 6 && !(getPreferences().right_chat_log && sectionId === 5)">
      <a :href="getSectionHref(sectionId)" :title="getSectionTitle(sectionId)">
        <div class="sidebar_item sidebar_item_shortcut draggable-section"
             :class="{ 'goto-cards': sectionId === 3 }"
             draggable="true"
             @dragstart="onSectionDragStart($event, sectionId)"
             @dragend="onSectionDragEnd"
             @dragover="onSectionDragOver($event, sectionId)"
             @dragleave="onSectionDragLeave"
             @drop="onSectionDrop($event, sectionId)">
          <i class="sidebar_icon" :class="getSectionIconClass(sectionId)">
            <slot v-if="sectionId === 3"></slot>
          </i>
        </div>
      </a>
  </template>
  </template>

  <!-- Bottom icons container -->
  <div class="sidebar-bottom-icons">
    <language-icon></language-icon>

    <div class="sidebar_item sidebar_item--info" :title="$t('Information panel')">
      <i class="sidebar_icon sidebar_icon--info"
        :class="{'sidebar_item--is-active': ui.gamesetup_detail_open}"
        v-on:click="ui.gamesetup_detail_open = !ui.gamesetup_detail_open"
        :title="$t('game setup details')"></i>
      <div class="info_panel" v-if="ui.gamesetup_detail_open">
        <div class="info_panel-spacing"></div>
        <div class="info-panel-title" v-i18n>Game Setup Details</div>
        <game-setup-detail :gameOptions="gameOptions" :playerNumber="playerNumber" :lastSoloGeneration="lastSoloGeneration"></game-setup-detail>

        <div class="info_panel_actions">
          <button class="btn btn-lg btn-primary" v-on:click="ui.gamesetup_detail_open=false" v-i18n>Ok</button>
        </div>
      </div>
    </div>

    <a href="help" target="_blank">
      <div class="sidebar_item sidebar_item--help">
        <i class="sidebar_icon sidebar_icon--help" :title="$t('player aid')"></i>
      </div>
    </a>

    <preferences-icon></preferences-icon>
  </div>
</div>
</template>

<script lang="ts">

import Vue from 'vue';
import {Color} from '@/common/Color';
import {getPreferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {TurmoilModel} from '@/common/models/TurmoilModel';
import {PartyName} from '@/common/turmoil/PartyName';
import GameSetupDetail from '@/client/components/GameSetupDetail.vue';
import {GameOptionsModel} from '@/common/models/GameOptionsModel';
import GlobalParameterValue from '@/client/components/GlobalParameterValue.vue';
import MoonGlobalParameterValue from '@/client/components/moon/MoonGlobalParameterValue.vue';
import {GlobalParameter} from '@/common/GlobalParameter';
import {MoonModel} from '@/common/models/MoonModel';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import {SectionOrderStorage} from '@/client/utils/SectionOrderStorage';

export default Vue.extend({
  name: 'sidebar',
  props: {
    playerNumber: {
      type: Number,
    },
    gameOptions: {
      type: Object as () => GameOptionsModel,
    },
    acting_player: {
      type: Boolean,
    },
    player_color: {
      type: String as () => Color,
    },
    generation: {
      type: Number,
    },
    coloniesCount: {
      type: Number,
    },
    temperature: {
      type: Number,
    },
    oxygen: {
      type: Number,
    },
    oceans: {
      type: Number,
    },
    venus: {
      type: Number,
    },
    moonData: {
      type: Object as () => MoonModel,
    },
    turmoil: {
      type: Object as () => TurmoilModel || undefined,
    },
    lastSoloGeneration: {
      type: Number,
    },
    sectionOrder: {
      type: Array as () => number[],
      default: () => [1, 2, 3, 4, 5],
    },
    chatVisible: {
      type: Boolean,
      default: false,
    },
    unreadMessageCount: {
      type: Number,
      default: 0,
    },
  },
  components: {
    'game-setup-detail': GameSetupDetail,
    'global-parameter-value': GlobalParameterValue,
    MoonGlobalParameterValue,
    PreferencesIcon,
    LanguageIcon,
  },
  data() {
    const pm = PreferencesManager.INSTANCE.values();
    return {
      'ui': {
        'gamesetup_detail_open': false,
      },
      'globalParameter': GlobalParameter,
      'draggedSection': null as number | null,
      'dragOverSection': null as number | null,
      'globalParamsOpen': (pm as any).sidebar_global_params_open || false,
    };
  },
  methods: {
    getSideBarClass(): string {
      return this.acting_player && (getPreferences().hide_animated_sidebar === false) ? 'preferences_acting_player' : 'preferences_nonacting_player';
    },
    getGenMarker(): string {
      return `${this.generation}`;
    },
    rulingPartyToCss(): string {
      if (this.turmoil.ruling === undefined) {
        console.warn('no party provided');
        return '';
      }
      return this.turmoil.ruling.toLowerCase().split(' ').join('_');
    },
    getRulingParty(): string {
      switch (this.turmoil.ruling) {
      case PartyName.MARS:
        return 'Mars';
      case PartyName.SCIENTISTS:
        return 'Science';
      case PartyName.KELVINISTS:
        return 'Kelvin';
      case undefined:
        return '???';
      default:
        return this.turmoil.ruling;
      }
    },
    onSectionDragStart(event: DragEvent, sectionId: number): void {
      this.draggedSection = sectionId;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
      }
      (event.target as HTMLElement).classList.add('dragging');
    },
    onSectionDragEnd(event: DragEvent): void {
      this.draggedSection = null;
      this.dragOverSection = null;
      (event.target as HTMLElement).classList.remove('dragging');
      document.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
    },
    onSectionDragOver(event: DragEvent, targetSectionId: number): void {
      if (this.draggedSection === null || this.draggedSection === targetSectionId) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }
      this.dragOverSection = targetSectionId;
      (event.currentTarget as HTMLElement).classList.add('drag-over');
    },
    onSectionDragLeave(event: DragEvent): void {
      (event.currentTarget as HTMLElement).classList.remove('drag-over');
    },
    onSectionDrop(event: DragEvent, targetSectionId: number): void {
      event.preventDefault();
      if (this.draggedSection === null || this.draggedSection === targetSectionId) return;

      // Emit event to parent component to handle section reordering
      this.$emit('section-order-changed', {
        draggedSection: this.draggedSection,
        targetSection: targetSectionId,
      });

      // Clean up
      (event.currentTarget as HTMLElement).classList.remove('drag-over');
      this.draggedSection = null;
      this.dragOverSection = null;
    },
    getSectionIconClass(sectionId: number): string {
      switch (sectionId) {
        case 1: return 'sidebar_icon--board';
        case 2: return 'sidebar_icon--actions';
        case 3: return 'sidebar_icon--cards';
        case 4: return 'sidebar_icon--colonies';
        case 5: return 'sidebar_icon--log';
        case 6: return 'sidebar_icon--chat';
        default: return 'sidebar_icon--unknown';
      }
    },
    getSectionHref(sectionId: number): string {
      return '#' + SectionOrderStorage.getSectionName(sectionId);
    },

    toggleChat(): void {
      this.$emit('toggle-chat');
    },
    getSectionTitle(sectionId: number): string {
      return this.$t(SectionOrderStorage.getSectionTitle(sectionId));
    },
    shouldShowSection(sectionId: number): boolean {
      // Colonies only show if colonies exist
      if (sectionId === 4) return this.coloniesCount > 0;
      return true;
    },
    toggleGlobalParams() {
      this.globalParamsOpen = !this.globalParamsOpen;
      PreferencesManager.INSTANCE.set('sidebar_global_params_open', this.globalParamsOpen);
    },
  },
  computed: {
    preferencesManager(): PreferencesManager {
      return PreferencesManager.INSTANCE;
    },
  },
});

</script>

<style scoped>
.sidebar_item {
  position: relative;
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ff4444;
  color: white;
  border-radius: 10px;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  border: 1px solid #cc0000;
}
</style>
