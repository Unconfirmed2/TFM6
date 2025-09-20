<template>
  <div id="player-home" :class="[(game.turmoil ? 'with-turmoil': ''), (useRightDock && chatVisible ? 'with-dock' : '')]">
  <player-info-top-container :playerView="playerView" />

    <div v-if="game.phase === 'end'">
      <div class="player_home_block">
        <DynamicTitle title="This game is over!" :color="thisPlayer.color"/>
        <a :href="'the-end?id='+ playerView.id" v-i18n>Go to game results</a>
      </div>
    </div>

    <sidebar v-trim-whitespace
      :acting_player="isPlayerActing(playerView)"
      :player_color="thisPlayer.color"
      :generation="game.generation"
      :coloniesCount="game.colonies.length"
      :temperature = "game.temperature"
      :oxygen = "game.oxygenLevel"
      :oceans = "game.oceans"
      :venus = "game.venusScaleLevel"
      :turmoil = "game.turmoil"
      :moonData="game.moon"
      :gameOptions = "game.gameOptions"
      :playerNumber = "playerView.players.length"
      :lastSoloGeneration = "game.lastSoloGeneration"
      :sectionOrder="sectionOrder"
      :chatVisible="chatVisible"
      :unreadMessageCount="unreadMessageCount"
      @section-order-changed="onSectionOrderChanged"
      @toggle-chat="chatVisible = !chatVisible">
        <div class="deck-size">{{ game.deckSize }}</div>
    </sidebar>

    <!-- Main layout with docked right sidepanel -->
    <div class="player-main-layout">
      <div class="player-main-flex">
        <!-- Dynamic section rendering based on user-defined order -->
        <div v-for="sectionId in sectionOrder" :key="sectionId">
      <player-home-section-container :sectionType="getSectionType(sectionId)" :index="sectionId">

        <!-- BOARD SECTION -->
        <div v-if="sectionId === 1 && thisPlayer.tableau.length > 0" class="player_home_block">
          <div class="board-ma-controls-row">
            <div class="board-scale-controls">
              <button class="btn btn-small" @click.prevent="decreaseBoardScale">-</button>
              <span class="board-scale-value">{{ boardScale.toFixed(1) }}x</span>
              <button class="btn btn-small" @click.prevent="increaseBoardScale">+</button>
            </div>
          </div>
          <div ref="boardWrapper" :style="boardWrapperStyle" class="board-ma-outer">
            <div ref="boardMa" class="board-ma-container" :style="{ transform: 'scale(' + boardScale + ')', transformOrigin: 'top left' }">
              <Milestones v-if="playerView.players.length > 1" :milestones="game.milestones" />
              <div class="board-area">
                <a name="board" class="player_home_anchor"></a>
                <board
                  :spaces="game.spaces"
                  :expansions="game.gameOptions.expansions"
                  :venusScaleLevel="game.venusScaleLevel"
                  :boardName ="game.gameOptions.boardName"
                  :oceans_count="game.oceans"
                  :oxygen_level="game.oxygenLevel"
                  :temperature="game.temperature"
                  :altVenusBoard="game.gameOptions.altVenusBoard"
                  :aresData="game.aresData"
                  :tileView="tileView"
                  @toggleTileView="cycleTileView()"
                  id="shortkey-board"
                />
                <Awards v-if="playerView.players.length > 1" :awards="game.awards" />
                <turmoil v-if="game.turmoil" :turmoil="game.turmoil"/>
                <MoonBoard v-if="game.gameOptions.expansions.moon" :model="game.moon" :tileView="tileView" id="shortkey-moonBoard"/>
              </div>
            </div>
          </div>
          <!-- Pathfinders / Planetary tracks are shown outside the scaled board container so they don't get scaled with the board -->
          <div class="player_home_block player_home_block--pathfinders" v-if="game.gameOptions.expansions.pathfinders">
            <PlanetaryTracks :tracks="game.pathfinders" :gameOptions="game.gameOptions" />
          </div>
        </div>

        <!-- ACTIONS SECTION -->
        <div v-else-if="sectionId === 2" class="player_home_block player_home_block--actions nofloat">
          <a name="actions" class="player_home_anchor"></a>
          <dynamic-title title="Actions" :color="thisPlayer.color"/>
          <waiting-for v-if="game.phase !== 'end'" :players="playerView.players" :playerView="playerView" :settings="settings" :waitingfor="playerView.waitingFor"></waiting-for>
        </div>

        <!-- CARDS SECTION -->
        <div v-else-if="sectionId === 3">
          <!-- Drafted cards -->
          <div class="player_home_block player_home_block--hand" v-if="playerView.draftedCards.length > 0">
            <dynamic-title title="Drafted cards" :color="thisPlayer.color" />
            <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
              <Card :card="card"/>
            </div>
          </div>

          <!-- Cards in hand -->
          <a name="cards" class="player_home_anchor"></a>
          <div class="player_home_block player_home_block--hand" v-if="cardsInHandCount > 0" id="shortkey-hand">
            <div class="hiding-card-button-row">
              <dynamic-title title="Cards In Hand" :color="thisPlayer.color"/>
              <div :class="getHideButtonClass('HAND')" v-on:click.prevent="toggle('HAND')">
                <div class="played-cards-count">{{cardsInHandCount.toString()}}</div>
                <div class="played-cards-selection" v-i18n>{{ getToggleLabel('HAND')}}</div>
              </div>
              <div class="text-overview" v-i18n>[ toggle cards in hand ]</div>
            </div>
            <sortable-cards v-show="isVisible('HAND')" :playerId="playerView.id"
                            :cards="playerView.preludeCardsInHand
                                    .concat(playerView.ceoCardsInHand)
                                    .concat(playerView.cardsInHand)"/>
          </div>

          <!-- Players overview -->
          <players-overview class="player_home_block player_home_block--players nofloat" :playerView="playerView" v-trim-whitespace id="shortkey-playersoverview"/>

          <!-- Self-replicating robots cards -->
          <div v-if="thisPlayer.selfReplicatingRobotsCards.length > 0" class="player_home_block">
            <dynamic-title title="Self-replicating Robots cards" :color="thisPlayer.color"/>
            <div>
              <div v-for="card in thisPlayer.selfReplicatingRobotsCards" :key="card.name" class="cardbox">
                <Card :card="card"/>
              </div>
            </div>
          </div>
        </div>

        <!-- COLONIES SECTION -->
        <div v-else-if="sectionId === 4 && game.colonies.length > 0"
             class="player_home_block"
             ref="colonies"
             id="shortkey-colonies">
          <a name="colonies" class="player_home_anchor"></a>
          <dynamic-title title="Colonies" :color="thisPlayer.color"/>
          <div class="colonies-fleets-cont">
            <div class="colonies-player-fleets" v-for="colonyPlayer in playerView.players" :key="colonyPlayer.color">
              <div :class="'colonies-fleet colonies-fleet-'+ colonyPlayer.color" v-for="idx in getFleetsCountRange(colonyPlayer)" :key="idx"></div>
            </div>
          </div>
          <div class="player_home_colony_cont">
            <div class="player_home_colony" v-for="colony in game.colonies" :key="colony.name">
              <colony :colony="colony" :active="colony.isActive"></colony>
            </div>
          </div>
        </div>

  <!-- LOG SECTION -->
  <div v-else-if="sectionId === 5 && !useRightDock" class="player_home_block nofloat">
          <a name="log" class="player_home_anchor"></a>
          <log-panel
            :id="playerView.id"
            :players="playerView.players"
            :generation="game.generation"
            :lastSoloGeneration="game.lastSoloGeneration"
            :color="thisPlayer.color"
            :step="game.step"></log-panel>
        </div>

  <!-- CHAT SECTION -->
  <div v-else-if="sectionId === 6 && !useRightDock" class="player_home_block">
          <a name="chat" class="player_home_anchor"></a>
            <!-- Keep the chat component instance alive so it doesn't unmount/remount when
                 the PlayerHome re-renders or the chat section is toggled. Use a stable key
                 based on game id + player id so each player/game has its own cached instance. -->
            <keep-alive>
              <chat-component
                v-show="chatVisible"
                ref="inplaceChat"
                :key="((game && game.id) || 'game') + '-' + playerView.id"
                :playerView="playerView"
                :players="playerView.players"
                @new-message="onNewMessage">
              </chat-component>
            </keep-alive>
        </div>


      </player-home-section-container>
        </div>

        <!-- Persistent chat section that's always rendered but hidden when not active -->
        <div v-if="!useRightDock && sectionOrder.includes(6)" v-show="currentVisibleSection === 6" class="player_home_block">
          <keep-alive>
            <chat-component
              v-show="chatVisible"
              ref="inplaceChat"
              :key="'chat-' + playerView.id"
              :playerView="playerView"
              :players="playerView.players"
              @new-message="onNewMessage">
            </chat-component>
          </keep-alive>
        </div>

      </div>

    </div>

  <!-- Fixed dock on top right -->
  <div v-if="useRightDock" class="docked-sidepanel">
    <docked-log-panel
      :id="playerView.id"
      :players="playerView.players"
      :generation="game.generation"
      :lastSoloGeneration="game.lastSoloGeneration"
      :color="thisPlayer.color"
      :step="game.step"
    />
    <keep-alive>
      <chat-panel
        ref="dockedChatPanel"
        :key="((game && game.id) || 'game') + '-' + playerView.id + '-docked'"
        :playerView="playerView"
        :players="playerView.players"
        v-show="chatVisible"
        @new-message="onNewMessage"
      />
    </keep-alive>
  </div>

    <!-- Underground tokens (always at bottom) -->
    <div v-if="thisPlayer.underworldData.tokens.length > 0">
      <dynamic-title title="Claimed Underground Resource Tokens" :color="thisPlayer.color"/>
      <underground-tokens :underworldData="thisPlayer.underworldData"></underground-tokens>
    </div>

    <!-- Initial setup content (when tableau is empty) -->
    <div class="player_home_block player_home_block--setup nofloat" v-if="thisPlayer.tableau.length === 0">
      <template v-if="isInitialDraftingPhase()">
        <div v-for="card in playerView.dealtCorporationCards" :key="card.name" class="cardbox">
          <Card :card="card"/>
        </div>
        <div v-for="card in playerView.dealtPreludeCards" :key="card.name" class="cardbox">
          <Card :card="card"/>
        </div>
        <div v-for="card in playerView.dealtCeoCards" :key="card.name" class="cardbox">
          <Card :card="card"/>
        </div>
        <div v-for="card in playerView.dealtProjectCards" :key="card.name" class="cardbox">
          <Card :card="card"/>
        </div>
      </template>

      <div class="player_home_block player_home_block--hand" v-if="playerView.draftedCards.length > 0">
        <dynamic-title title="Drafted Cards" :color="thisPlayer.color"/>
        <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
          <Card :card="card"/>
        </div>
      </div>

      <template v-if="playerView.pickedCorporationCard.length === 1">
        <dynamic-title title="Your selected cards:" :color="thisPlayer.color"/>
        <div>
          <div class="cardbox">
            <Card :card="playerView.pickedCorporationCard[0]"/>
          </div>
          <template v-if="game.gameOptions.expansions.prelude">
            <div v-for="card in playerView.preludeCardsInHand" :key="card.name" class="cardbox">
              <Card :card="card"/>
            </div>
          </template>
          <template v-if="game.gameOptions.expansions.ceo">
            <div v-for="card in playerView.ceoCardsInHand" :key="card.name" class="cardbox">
              <Card :card="card"/>
            </div>
          </template>
        </div>
        <div>
          <div v-for="card in playerView.cardsInHand" :key="card.name" class="cardbox">
            <Card :card="card"/>
          </div>
        </div>
      </template>

      <dynamic-title v-if="playerView.pickedCorporationCard.length === 0" title="Select initial cards:" :color="thisPlayer.color"/>
      <waiting-for v-if="game.phase !== 'end'" :players="playerView.players" :playerView="playerView" :settings="settings" :waitingfor="playerView.waitingFor"></waiting-for>

      <dynamic-title title="Game details" :color="thisPlayer.color"/>

      <div class="player_home_block" v-if="playerView.players.length > 1">
        <div class="board-ma-container">
          <Milestones v-if="playerView.players.length > 1" :showScores="false" :milestones="game.milestones" />
          <Awards v-if="playerView.players.length > 1" :awards="game.awards" />
        </div>
      </div>

      <div class="player_home_block player_home_block--turnorder nofloat" v-if="playerView.players.length>1">
        <dynamic-title title="Turn order" :color="thisPlayer.color"/>
        <div class="player_item" v-for="(p, idx) in playerView.players" :key="idx" v-trim-whitespace>
          <div class="player_name_cont" :class="getPlayerCssForTurnOrder(p, true)">
            <span class="player_number">{{ idx+1 }}.</span><span class="player_name" :class="getPlayerCssForTurnOrder(p, false)" href="#">{{ p.name }}</span>
          </div>
          <div class="player_separator" v-if="idx !== playerView.players.length - 1">⟶</div>
        </div>
      </div>

      <details class="accordion board-accordion" open>
        <summary class="accordion-header">
          <div class="is-action">
            <i class="icon icon-arrow-right mr-1"></i>
            <span v-i18n>Board</span>
          </div>
        </summary>
        <div class="accordion-body">
          <board
            :spaces="game.spaces"
            :expansions="game.gameOptions.expansions"
            :venusScaleLevel="game.venusScaleLevel"
            :boardName ="game.gameOptions.boardName"
            :aresData="game.aresData"
            :altVenusBoard="game.gameOptions.altVenusBoard">
          </board>
          <turmoil v-if="game.turmoil" :turmoil="game.turmoil"></turmoil>
          <a name="moonBoard" class="player_home_anchor"></a>
          <MoonBoard v-if="game.gameOptions.expansions.moon" :model="game.moon" :tileView="tileView"></MoonBoard>
        </div>
      </details>
    </div>
    <div v-if="game.spectatorId">
      <a :href="'/spectator?id=' +game.spectatorId" target="_blank" rel="noopener noreferrer" v-i18n>Spectator link</a>
    </div>
    <purge-warning :expectedPurgeTimeMs="playerView.game.expectedPurgeTimeMs"></purge-warning>
  </div>

  <!-- Persistent chat component to maintain state -->
  <div v-if="!useRightDock" :style="chatContainerStyle">
    <keep-alive>
      <chat-component
        v-show="chatVisible && isChatSectionActive"
        ref="inplaceChat"
        :key="'persistent-chat-' + playerView.id"
        :playerView="playerView"
        :players="playerView.players"
        @new-message="onNewMessage">
      </chat-component>
    </keep-alive>
  </div>

</template>

<script lang="ts">
import Vue from 'vue';
import * as raw_settings from '@/genfiles/settings.json';

import Board from '@/client/components/Board.vue';
import Card from '@/client/components/card/Card.vue';
import Milestones from '@/client/components/Milestones.vue';
import Awards from '@/client/components/Awards.vue';
import PlayersOverview from '@/client/components/overview/PlayersOverview.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import Sidebar from '@/client/components/Sidebar.vue';
import Colony from '@/client/components/colonies/Colony.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import Turmoil from '@/client/components/turmoil/Turmoil.vue';
import PlanetaryTracks from '@/client/components/pathfinders/PlanetaryTracks.vue';
import DynamicTitle from '@/client/components/common/DynamicTitle.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import PlayerInfoTopContainer from '@/client/components/PlayerInfoTopContainer.vue';
import MoonBoard from '@/client/components/moon/MoonBoard.vue';
import PurgeWarning from '@/client/components/common/PurgeWarning.vue';
import UndergroundTokens from '@/client/components/underworld/UndergroundTokens.vue';
import ChatComponent from '@/client/components/ChatComponent.vue';
import DockedChatPanel from '@/client/components/docked/ChatPanel.vue';
import DockedLogPanel from '@/client/components/docked/DockedLogPanel.vue';
import {playerColorClass} from '@/common/utils/utils';
import {getPreferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {KeyboardNavigation} from '@/client/components/KeyboardNavigation';
import {Phase} from '@/common/Phase';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {nextTileView, TileView} from './board/TileView';
import {SectionOrderStorage} from '@/client/utils/SectionOrderStorage';
import PlayerHomeSectionContainer from '@/client/components/PlayerHomeSectionContainer.vue';


export interface PlayerHomeModel {
  showHand: boolean;
  showActiveCards: boolean;
  showAutomatedCards: boolean;
  showEventCards: boolean;
  tileView: TileView;
  boardScale: number;
  baseBoardWidth: number;
  baseBoardHeight: number;
  sectionOrder: number[];
  chatVisible: boolean;
  unreadMessageCount: number;
  useRightDock: boolean;
  chatMounted: boolean;
  chatMountedDocked: boolean;
}

class TerraformedAlertDialog {
  static shouldAlert = true;
}

export default Vue.extend({
  name: 'player-home',
  data(): PlayerHomeModel {
    const preferences = getPreferences();
    return {
      showHand: !preferences.hide_hand,
      showActiveCards: !preferences.hide_active_cards,
      showAutomatedCards: !preferences.hide_automated_cards,
      showEventCards: !preferences.hide_event_cards,
      tileView: 'show',
      boardScale: preferences.board_scale,
      baseBoardWidth: 0,
      baseBoardHeight: 0,
      sectionOrder: [1, 2, 3, 4, 5, 6], // Default order: Board, Actions, Cards, Colonies, Log, Chat
      chatVisible: preferences.chat_visible,
      unreadMessageCount: 0,
      useRightDock: (preferences as any).right_chat_log === true,
  chatMounted: true,
  chatMountedDocked: true,
    };
  },
  watch: {
    showHand: function hide_hand() {
      PreferencesManager.INSTANCE.set('hide_hand', !this.showHand);
    },
    showActiveCards: function toggle_active_cards() {
      PreferencesManager.INSTANCE.set('hide_active_cards', !this.showActiveCards);
    },
    showAutomatedCards: function toggle_automated_cards() {
      PreferencesManager.INSTANCE.set('hide_automated_cards', !this.showAutomatedCards);
    },
    showEventCards: function toggle_event_cards() {
      PreferencesManager.INSTANCE.set('hide_event_cards', !this.showEventCards);
    },
    chatVisible: function toggle_chat() {
      PreferencesManager.INSTANCE.set('chat_visible', this.chatVisible);
      if (this.chatVisible) {
        this.unreadMessageCount = 0;

        // Ensure chat components are mounted
        if (!this.chatMounted) {
          this.chatMounted = true;
        }
        if (!this.chatMountedDocked) {
          this.chatMountedDocked = true;
        }

        // Scroll the chat to bottom when opened with a small delay to ensure rendering
        this.$nextTick(() => {
          setTimeout(() => {
            try {
              const inPlace: any = (this as any).$refs.inplaceChat;
              if (inPlace && typeof inPlace.scrollToBottomPublic === 'function' && this.useRightDock === false) {
                inPlace.scrollToBottomPublic();
                return;
              }
              const docked: any = (this as any).$refs.dockedChatPanel;
              if (docked && typeof docked.scrollToBottom === 'function') {
                docked.scrollToBottom();
              }
            } catch (e) {
              // ignore
            }
          }, 100);
        });
      }
    },
    boardScale: function save_board_scale() {
      PreferencesManager.INSTANCE.set('board_scale', this.boardScale);
    },
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
    },
    settings: {
      type: Object as () => typeof raw_settings,
    },
  },
  computed: {
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    game(): GameModel {
      return this.playerView.game;
    },
    cardsInHandCount(): number {
      const playerView = this.playerView;
      return playerView.cardsInHand.length + playerView.preludeCardsInHand.length + playerView.ceoCardsInHand.length;
    },
    currentVisibleSection(): number {
      // Returns which section should be currently visible
      // This mimics the v-if/v-else-if logic but as a computed property
      for (const sectionId of this.sectionOrder) {
        if (sectionId === 1 && this.thisPlayer.tableau.length > 0) return 1;
        if (sectionId === 2) return 2;
        if (sectionId === 3) return 3;
        if (sectionId === 4 && this.game.colonies.length > 0) return 4;
        if (sectionId === 5 && !this.useRightDock) return 5;
        if (sectionId === 6 && !this.useRightDock) return 6;
      }
      return 0;
    },
    boardWrapperStyle(): any {
      // Provide an initial style object; width/height are updated dynamically.
      // Use full responsive width for the wrapper and a fixed base height
      // of 600px which will be scaled by `boardScale`.
      const baseH = this.baseBoardHeight || 600;
      const height = (Math.round(baseH * this.boardScale) + 80) + 'px';

      return {
        overflow: 'visible',
        display: 'flex',
        width: '100%', // occupy the parent width responsively
        height,
      };
    },

    // ...existing computed properties

  },

  components: {
    'board': Board,
    DynamicTitle,
    Card,
    'players-overview': PlayersOverview,
    'waiting-for': WaitingFor,
    Milestones,
    Awards,
    'sidebar': Sidebar,
    'colony': Colony,
    'log-panel': LogPanel,
    'turmoil': Turmoil,
    'sortable-cards': SortableCards,
    'player-info-top-container': PlayerInfoTopContainer,
    'player-home-section-container': PlayerHomeSectionContainer,
    MoonBoard,
    PlanetaryTracks,
    PurgeWarning,
    UndergroundTokens,
    'chat-component': ChatComponent,
    'chat-panel': DockedChatPanel,
    'docked-log-panel': DockedLogPanel,
  },
  methods: {
    navigatePage(event: KeyboardEvent) {
      const ids: Partial<Record<string, string>> = {
        [KeyboardNavigation.GAMEBOARD]: 'shortkey-board',
        [KeyboardNavigation.PLAYERSOVERVIEW]: 'shortkey-playersoverview',
        [KeyboardNavigation.HAND]: 'shortkey-hand',
        [KeyboardNavigation.COLONIES]: 'shortkey-colonies',
      };
      if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const inputSource = event.target as Node;
      if (inputSource.nodeName.toLowerCase() !== 'input') {
        const id = ids[event.code];
        if (id) {
          const el = document.getElementById(id);
          if (el) {
            event.preventDefault();
            el.scrollIntoView({block: 'center', inline: 'center', behavior: 'auto'});
          }
        }
      }
    },
    isPlayerActing(playerView: PlayerViewModel) : boolean {
      return playerView.players.length > 1 && playerView.waitingFor !== undefined;
    },
    getPlayerCssForTurnOrder: (
      player: PublicPlayerModel,
      highlightActive: boolean,
    ): string => {
      const classes = ['highlighter_box'];
      if (highlightActive) {
        if (player.needsToDraft || (player.needsToDraft === undefined && player.isActive)) {
          classes.push('player_is_active');
        }
        classes.push(playerColorClass(player.color, 'bg'));
      }
      return classes.join(' ');
    },
    getFleetsCountRange(player: PublicPlayerModel): Array<number> {
      const fleetsRange = [];
      for (let i = 0; i < player.fleetSize - player.tradesThisGeneration; i++) {
        fleetsRange.push(i);
      }
      return fleetsRange;
    },
    toggle(type: string): void {
      switch (type) {
      case 'HAND':
        this.showHand = !this.showHand;
        break;
      case 'ACTIVE':
        this.showActiveCards = !this.showActiveCards;
        break;
      case 'AUTOMATED':
        this.showAutomatedCards = !this.showAutomatedCards;
        break;
      case 'EVENT':
        this.showEventCards = !this.showEventCards;
        break;
      }
    },
    cycleTileView(): void {
      this.tileView = nextTileView(this.tileView);
    },
    isVisible(type: string): boolean {
      switch (type) {
      case 'HAND':
        return this.showHand;
      case 'ACTIVE':
        return this.showActiveCards;
      case 'AUTOMATED':
        return this.showAutomatedCards;
      case 'EVENT':
        return this.showEventCards;
      }
      return false;
    },
    isInitialDraftingPhase(): boolean {
      return (this.game.phase === Phase.INITIALDRAFTING) && this.game.gameOptions.initialDraftVariant;
    },
    setBoardScale(scale: number) {
      this.boardScale = Math.max(0.4, Math.min(2, scale));
      this.updateBoardWrapperSize();
    },
    increaseBoardScale() {
      this.setBoardScale(this.boardScale + 0.1);
    },
    decreaseBoardScale() {
      this.setBoardScale(this.boardScale - 0.1);
    },
    updateBoardWrapperSize() {
      try {
        const wrapper: any = (this as any).$refs.boardWrapper;
        const ma: any = (this as any).$refs.boardMa;
        if (wrapper && ma && ma.getBoundingClientRect) {
          // Unified sizing: measure the inner container when available and
          // scale the measured width/height for the wrapper. Fall back to
          // stored base values or sensible defaults.
          try {
            const rect = ma.getBoundingClientRect();

            // Undo the current transform scale to compute the unscaled base width
            const unscaledW = this.boardScale ? rect.width / this.boardScale : rect.width;

            // store measured unscaled width and force base height to 600px
            this.baseBoardWidth = unscaledW || this.baseBoardWidth || rect.width || 842;
            this.baseBoardHeight = this.baseBoardHeight || 600;

            // keep wrapper responsive in width and set scaled height
            wrapper.style.width = '100%';
            wrapper.style.height = (Math.round(this.baseBoardHeight * this.boardScale) + 80) + 'px';
          } catch (e) {
            // Fallback: responsive width and scaled base height
            this.baseBoardWidth = this.baseBoardWidth || 842;
            this.baseBoardHeight = this.baseBoardHeight || 600;
            wrapper.style.width = '100%';
            wrapper.style.height = (Math.round(this.baseBoardHeight * this.boardScale) + 80) + 'px';
          }
        }
      } catch (e) {
        // ignore
      }
    },
    getToggleLabel(hideType: string): string {
      if (hideType === 'HAND') {
        return (this.showHand ? '✔' : '');
      } else if (hideType === 'ACTIVE') {
        return (this.showActiveCards? '✔' : '');
      } else if (hideType === 'AUTOMATED') {
        return (this.showAutomatedCards ? '✔' : '');
      } else if (hideType === 'EVENT') {
        return (this.showEventCards ? '✔' : '');
      } else {
        return '';
      }
    },
    getHideButtonClass(hideType: string): string {
      const prefix = 'hiding-card-button ';
      if (hideType === 'HAND') {
        return prefix + (this.showHand ? 'hand-toggle' : 'hand-toggle-transparent');
      } else if (hideType === 'ACTIVE') {
        return prefix + (this.showActiveCards ? 'active' : 'active-transparent');
      } else if (hideType === 'AUTOMATED') {
        return prefix + (this.showAutomatedCards ? 'automated' : 'automated-transparent');
      } else if (hideType === 'EVENT') {
        return prefix + (this.showEventCards ? 'event' : 'event-transparent');
      } else {
        return '';
      }
    },
    getSectionType(sectionId: number): string {
      switch (sectionId) {
      case 1: return 'board';
      case 2: return 'actions';
      case 3: return 'cards';
      case 4: return 'colonies';
      case 5: return 'log';
      case 6: return 'chat';
      default: return 'unknown';
      }
    },
    onSectionOrderChanged(dragData: {draggedSection: number, targetSection: number}): void {
      const currentOrder = [...this.sectionOrder];
      const draggedIndex = currentOrder.indexOf(dragData.draggedSection);
      const targetIndex = currentOrder.indexOf(dragData.targetSection);

      // Remove dragged section and insert at target position
      currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, dragData.draggedSection);

      this.sectionOrder = currentOrder;
      SectionOrderStorage.updateSectionOrder(this.playerView.id, currentOrder);
    },
    onNewMessage(): void {
      // When chat is not visible, increment unread counter
      if (!this.chatVisible) {
        this.unreadMessageCount++;
        return;
      }
      // If chat is visible, scroll the visible chat instance to bottom
      this.$nextTick(() => {
        try {
          // Prioritize in-place chat if present and visible
          const inPlace: any = (this as any).$refs.inplaceChat;
          if (inPlace && typeof inPlace.scrollToBottomPublic === 'function' && this.useRightDock === false) {
            inPlace.scrollToBottomPublic();
            return;
          }
          // If using docked chat, call its wrapper's method
          const docked: any = (this as any).$refs.dockedChatPanel;
          if (docked && typeof docked.scrollToBottom === 'function') {
            docked.scrollToBottom();
          }
        } catch (e) {
          // ignore
        }
      });
    },


  },
  created() {
    // nothing here yet
  },
  destroyed() {
    window.removeEventListener('keydown', this.navigatePage);
  },
  mounted() {
    window.addEventListener('keydown', this.navigatePage);

    // Load section order from storage
    this.sectionOrder = SectionOrderStorage.getSectionOrder(this.playerView.id);

    // Set up viewport height for dock sizing
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    (this as any)._setVh = setVh;

    // initialize board size and listeners for scaling
    this.$nextTick(() => {
      const ma: any = (this as any).$refs.boardMa;
      if (ma && ma.getBoundingClientRect) {
        const rect = ma.getBoundingClientRect();

        // Debug: Check what's actually happening
        const milestones = ma.querySelector('.milestones_cont');
        const awards = ma.querySelector('.awards_cont');

        console.log('=== MA Container Debug ===');
        console.log('Full container:', rect.width, 'x', rect.height);

        if (milestones) {
          const mRect = milestones.getBoundingClientRect();
          console.log('Milestones container:', mRect.width, 'x', mRect.height);
        }
        if (awards) {
          const aRect = awards.getBoundingClientRect();
          console.log('Awards container:', aRect.width, 'x', aRect.height);
        }

        // compute unscaled width by undoing any current scale transform
        const unscaledW = this.boardScale ? rect.width / this.boardScale : rect.width;
        this.baseBoardWidth = unscaledW || this.baseBoardWidth || rect.width || 842;
        // force base height to 600px as requested
        this.baseBoardHeight = 700;
        this.updateBoardWrapperSize();
      }
      window.addEventListener('resize', this.updateBoardWrapperSize);
      // Listen for preference changes so UI updates reactively
      (this as any)._onPreferencesChanged = (e: any) => {
        try {
          const name = e && e.detail && e.detail.name;
          if (name === 'right_chat_log') {
            this.useRightDock = getPreferences().right_chat_log === true;
          }
        } catch (err) {
          // ignore
        }
      };
      window.addEventListener('preferences-changed', (this as any)._onPreferencesChanged);
    });
    if (this.game.isTerraformed && TerraformedAlertDialog.shouldAlert && getPreferences().show_alerts) {
      alert('Mars is Terraformed!');
      // Avoids repeated calls.
      TerraformedAlertDialog.shouldAlert = false;
    }
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateBoardWrapperSize);
    if ((this as any)._setVh) {
      window.removeEventListener('resize', (this as any)._setVh);
      (this as any)._setVh = undefined;
    }
    if ((this as any)._onPreferencesChanged) {
      window.removeEventListener('preferences-changed', (this as any)._onPreferencesChanged);
      (this as any)._onPreferencesChanged = undefined;
    }
  },
});

</script>

<style>
.board-ma-container { display:flex; flex-direction:row; gap:20px; height:fit-content; align-items:flex-start; flex-wrap:nowrap; min-height: 100vh; }
.board-area { flex: 0 0 auto; min-width: 320px; align-items:center}
.board-ma-outer { display:inline-flex; width: 100%; transition: width 150ms ease, height 150ms ease; }
.board-ma-container { transform-origin: top left; transition: transform 150ms ease; }
.board-ma-outer {
  /* Place the board below UI controls (non-negative z-index is safe). */
  z-index: 0;
}
.player_home_block { margin-bottom: 12px; }
#player-home { padding-bottom: calc(env(safe-area-inset-bottom, 12px) + 312px); }
#player-home.with-dock { padding-right: 20%; /* reserve space for right dock, similar to left sidebar */ }
.player_home_block.player_home_block--actions {
  /* Ensure the actions area (where buttons live) sits above the board */
  position: relative;
  z-index: 10;
}
.board-ma-controls-row { display:flex; justify-content:flex-start; margin-bottom:8px; }
.board-scale-controls { display:flex; align-items:center; gap:8px; }
.board-scale-value { font-weight:600; }
.btn-small { padding:4px 8px; font-size:14px; }
/* Layout for main content with docked right sidepanel */
.player-main-layout { display: flex; width: 100%; align-items: flex-start; }
.player-main-flex { flex: 1 1 auto; min-width: 0; }

/* Fixed dock on top right - full viewport height */
.docked-sidepanel {
  position: fixed;
  top: 0;
  right: 0;
  width: 20%;
  height: 100vh;
  box-sizing: border-box;
  padding: 0;
  overflow: hidden;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  gap: 0;
  background-color: #000;
  color: #ddd;
}

/* Ensure duplicated chat/log appear inside the dock instead of fixed to viewport */
.docked-sidepanel .chat-container {
  /* remove fixed positioning and let the dock control sizing */
  position: static !important;
  bottom: auto !important;
  left: auto !important;
  right: auto !important;
  width: 100% !important;
  box-shadow: none !important;
  /* use available dock height: 50% of dock */
  /* use --vh set by JS for accurate viewport height (handles zoom/mobile UI) */
  height: calc(var(--vh, 1vh) * 100 * 0.50) !important;
  max-height: calc(var(--vh, 1vh) * 100 * 0.50) !important;
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
}

/* Make messages area take available space and be scrollable; pin input to bottom */
.docked-sidepanel .chat-messages {
  flex: 1 1 auto !important;
  min-height: 0 !important; /* allow proper flexbox scrolling */
  overflow-y: auto !important;
  padding: 8px !important;
}

/* Remove internal bottom padding inside the chat input so it sits flush */
.docked-sidepanel .chat-input-container {
  display: flex !important;
  flex: 0 0 auto !important;
  padding: 0 !important;
  margin: 0 !important;
  height: auto !important;
  background: transparent !important;
  border-top: none !important;
}

/* Make the input expand and sit flush; remove margins that create gaps */
.docked-sidepanel .chat-input {
  flex: 1 !important;
  margin: 0 !important;
  border-radius: 0 !important;
  padding: 8px !important; /* keep sensible inner padding for typing */
}
.docked-sidepanel .chat-send-btn {
  margin: 0 !important;
  border-radius: 0 !important;
}

.docked-sidepanel .log-container {
  /* Make log panel take the remaining dock height (50%) and scroll */
  height: calc(var(--vh, 1vh) * 100 * 0.50) !important;
  max-height: calc(var(--vh, 1vh) * 100 * 0.50) !important;
  flex: 0 0 auto;
  overflow: auto !important;
  padding: 0 !important;
  margin: 0 !important;
}

/* Force inner panels to be transparent so dock background shows through */
.docked-sidepanel .panel,
.docked-sidepanel .panel-body,
.docked-sidepanel .card-panel,
.docked-sidepanel .log-panel,
.docked-sidepanel .chat-container {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* Hide titles/headers inside the dock to reduce visual clutter */
.docked-sidepanel .dynamic-title,
.docked-sidepanel .log-title,
.docked-sidepanel .log-generations h2,
.docked-sidepanel .player_home_anchor,
.docked-sidepanel .player_home_block .dynamic-title {
  display: none !important;
}

/* Remove pagination / generation indicators inside the dock (we use dropdown in wrapper) */
.docked-sidepanel .log-gen-numbers,
.docked-sidepanel .log-gen-indicator,
.docked-sidepanel .log-gen-indicator--selected {
  display: none !important;
}
</style>
