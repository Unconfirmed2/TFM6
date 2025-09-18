<template>
  <div class="player_home_block">
    <a name="chat" class="player_home_anchor"></a>
    <DynamicTitle title="Chat" :color="thisPlayer.color"/>
    
    <div class="chat-container">
      <div class="chat-messages" ref="chatMessages">
        <div 
          v-for="message in messages" 
          :key="message.id" 
          class="chat-message"
          :class="{ 'own-message': message.playerId === playerView.id }"
        >
          <div v-if="message.playerId !== playerView.id" class="chat-message-header">
            <span 
              class="chat-player-name" 
              :class="getPlayerColorClass(message.playerId)"
            >{{ message.playerName }}</span>
            <span class="chat-timestamp">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div v-else class="chat-message-own-timestamp">
            {{ formatTime(message.timestamp) }}
          </div>
          <div class="chat-message-content">{{ message.message }}</div>
        </div>
        <div v-if="messages.length === 0" class="no-messages">
          No messages yet. Be the first to say something!
        </div>
      </div>
      
      <div class="chat-input-container">
        <input 
          type="text" 
          v-model="newMessage" 
          @keyup.enter="sendMessage"
          @keyup.escape="clearMessage"
          placeholder="Type a message..." 
          class="chat-input"
          maxlength="500"
          :disabled="isLoading"
        />
        <button 
          @click="sendMessage" 
          :disabled="!newMessage.trim() || isLoading"
          class="chat-send-btn"
        >
          {{ isLoading ? '...' : 'Send' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {ChatMessage} from '@/common/chat/ChatMessage';
import {paths} from '@/common/app/paths';
import {playerColorClass} from '@/common/utils/utils';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import DynamicTitle from '@/client/components/common/DynamicTitle.vue';

type DataModel = {
  messages: ChatMessage[];
  newMessage: string;
  isLoading: boolean;
  lastMessageId: string;
};

const MAX_MESSAGES = 200;

export default Vue.extend({
  name: 'ChatComponent',
  components: {
    DynamicTitle,
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    players: {
      type: Array as () => PublicPlayerModel[],
      required: true,
    },
  },
  data(): DataModel {
    // Hydration will be done in created() where we reliably have access to props
    // (playerView). Return defaults here; created() will override if persisted state exists.
    return {
      messages: [],
      newMessage: '',
      isLoading: false,
      lastMessageId: '',
    };
  },
  computed: {
    thisPlayer() {
      return this.playerView.thisPlayer;
    },
  },
  methods: {
    storageKey(): string {
      // Use explicit game id + player id to make the key unique per game+player
      const gameId = (this.playerView && this.playerView.game && (this.playerView.game as any).id) ? (this.playerView.game as any).id : 'nogame';
      const playerId = this.playerView ? this.playerView.id : 'noplayer';
      return `chat-${gameId}-${playerId}`;
    },
    async loadMessages() {
      try {
        const url = paths.API_CHAT + '?id=' + this.playerView.id + 
          (this.lastMessageId ? '&since=' + this.lastMessageId : '');
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          if (data.messages && data.messages.length > 0) {
            const hasNewMessages = data.messages.some((msg: ChatMessage) => msg.playerId !== this.playerView.id);
            // Append new messages but avoid duplicating messages already present
            const existingIds = new Set(this.messages.map(m => m.id));
            const newOnes = data.messages.filter((m: ChatMessage) => !existingIds.has(m.id));
            if (newOnes.length > 0) {
              this.messages.push(...newOnes);
              // Trim to most recent MAX_MESSAGES
              if (this.messages.length > MAX_MESSAGES) {
                this.messages = this.messages.slice(this.messages.length - MAX_MESSAGES);
              }
            }
            this.lastMessageId = data.lastMessageId || this.lastMessageId;
            // Persist updated state (trimmed)
            this.persistState();
            if (hasNewMessages) {
              this.$emit('new-message');
            }
            this.$nextTick(() => {
              this.scrollToBottom();
            });
          }
        }
      } catch (error) {
        console.warn('Failed to load chat messages:', error);
      }
    },
    async sendMessage() {
      if (!this.newMessage.trim() || this.isLoading) {
        return;
      }
      
      this.isLoading = true;
      try {
        const response = await fetch(paths.API_CHAT + '?id=' + this.playerView.id, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: this.newMessage,
          }),
        });
        
        if (response.ok) {
          this.newMessage = '';
          this.persistState();
          // Immediately reload to include our message
          await this.loadMessages();
        } else {
          const error = await response.text();
          console.error('Failed to send message:', error);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        this.isLoading = false;
      }
    },
    clearMessage() {
      this.newMessage = '';
    },
    scrollToBottom() {
      const messagesEl = this.$refs.chatMessages as HTMLElement;
      if (messagesEl) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    },
    formatTime(timestamp: number): string {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },
    getPlayerColorClass(playerId: string): string {
      const player = this.players.find(p => p.id === playerId);
      if (player) {
        return playerColorClass(player.color, 'bg');
      }
      return '';
    },
    checkForUpdates() {
      this.loadMessages();
    },
    persistState() {
      try {
        const key = this.storageKey();
        const toSave: Partial<DataModel> = {
          // Save only the most recent MAX_MESSAGES to avoid unbounded localStorage growth
          messages: (this.messages || []).slice(Math.max(0, (this.messages || []).length - MAX_MESSAGES)),
          newMessage: this.newMessage,
          lastMessageId: this.lastMessageId,
        };
        localStorage.setItem(key, JSON.stringify(toSave));
      } catch (e) {
        // ignore persistence errors
      }
    },
    loadPersistedState() {
      try {
        const key = this.storageKey();
        const raw = localStorage.getItem(key);
        if (raw) {
          const persisted = JSON.parse(raw) as Partial<DataModel>;
          if (persisted.messages && persisted.messages.length > 0) {
            this.messages = persisted.messages.slice(Math.max(0, persisted.messages.length - MAX_MESSAGES));
          }
          if (typeof persisted.newMessage === 'string') this.newMessage = persisted.newMessage;
          if (typeof persisted.lastMessageId === 'string') this.lastMessageId = persisted.lastMessageId;
        }
      } catch (e) {
        // ignore parse errors
      }
    },
    startPolling() {
      // Immediately load messages once and then poll on an interval.
      try {
        // load once immediately
        this.loadMessages();
        // avoid creating multiple intervals
        if ((this as any)._chatInterval) {
          clearInterval((this as any)._chatInterval);
        }
        (this as any)._chatInterval = setInterval(() => {
          this.checkForUpdates();
        }, 3000);
      } catch (e) {
        // ignore
      }
    },
    stopPolling() {
      try {
        if ((this as any)._chatInterval) {
          clearInterval((this as any)._chatInterval);
          (this as any)._chatInterval = undefined;
        }
      } catch (e) {
        // ignore
      }
    },
  },
  mounted() {
    // For normal mount (non-cached), ensure polling is started.
    this.startPolling();
  },
  created() {
    // Hydrate persisted state now that props are available
    this.loadPersistedState();
  },
  activated() {
    // Called when keep-alive activates the component instance.
    this.startPolling();
  },
  deactivated() {
    // Called when keep-alive deactivates the component instance.
    this.stopPolling();
  },
  beforeDestroy() {
    this.stopPolling();
  },
});
</script>

<style scoped>
.chat-container {
  border: 1px solid #444;
  border-radius: 8px;
  overflow: hidden;
  background-color: #222;
  position: fixed;
  bottom: env(safe-area-inset-bottom, 12px);
  left: 70px;
  right: 12px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  height: 300px;
  max-height: 300px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.6);
}

.chat-messages {
  flex: 1 1 auto;
  min-height: 0;
  max-height: calc(300px - 64px);
  overflow-y: auto;
  padding: 12px;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-message {
  margin-bottom: 8px;
  padding: 8px 12px;
  border-radius: 12px;
  background-color: #2a2a2a;
  font-size: 16px;
  max-width: 80%;
}

.chat-message.own-message {
  background-color: #0078d4;
  color: white;
  margin-left: auto;
  margin-right: 0;
  border-bottom-right-radius: 4px;
}

.chat-message:not(.own-message) {
  background-color: #3a3a3a;
  margin-right: auto;
  margin-left: 0;
  border-bottom-left-radius: 4px;
}

.chat-message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 16px;
}

.chat-player-name {
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 16px;
}

.chat-timestamp {
  color: white;
  font-size: 16px;
  opacity: 0.8;
}

.chat-message.own-message .chat-timestamp {
  color: rgba(255, 255, 255, 0.8);
}

.chat-message-own-timestamp {
  color: white;
  font-size: 16px;
  text-align: right;
  margin-bottom: 2px;
  opacity: 0.8;
}

.chat-message-content {
  word-wrap: break-word;
  color: #ddd;
  line-height: 1.4;
}

.chat-message.own-message .chat-message-content {
  color: white;
}

.no-messages {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 20px;
}

.chat-input-container {
  display: flex;
  padding: 8px;
  background-color: #2a2a2a;
  border-top: 1px solid #444;
  flex: 0 0 auto;
  height: 56px;
}

.chat-input {
  flex: 1;
  padding: 6px;
  border: 1px solid #555;
  border-radius: 3px;
  background-color: #333;
  color: #ddd;
  margin-right: 6px;
  font-size: 14px;
}

.chat-input:focus {
  outline: none;
  border-color: #777;
}

.chat-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.chat-send-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 3px;
  background-color: #0078d4;
  color: white;
  cursor: pointer;
  min-width: 50px;
  font-size: 14px;
}

.chat-send-btn:hover:not(:disabled) {
  background-color: #106ebe;
}

.chat-send-btn:disabled {
  background-color: #555;
  cursor: not-allowed;
}

/* Scrollbar styling */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* Overrides when chat is docked inside the sidepanel */
.docked-sidepanel .chat-container {
  position: static !important;
  bottom: auto !important;
  left: auto !important;
  right: auto !important;
  box-shadow: none !important;
  border-radius: 0 !important;
}

.docked-sidepanel .chat-messages {
  padding: 6px !important;
  background-color: transparent !important;
  overflow-y: auto !important;
}

.docked-sidepanel .chat-input-container {
  padding: 0 !important;
  margin: 0 !important;
  height: auto !important;
  background: transparent !important;
  border-top: none !important;
}

.docked-sidepanel .chat-input {
  margin: 0 !important;
  border-radius: 0 !important;
  padding: 8px !important;
}

.docked-sidepanel .chat-send-btn {
  margin: 0 !important;
}

/* Ensure the input bar is pinned to the bottom inside the dock */
.docked-sidepanel .chat-messages {
  display: flex !important;
  flex-direction: column !important;
  flex: 1 1 auto !important;
}
.docked-sidepanel .chat-input-container {
  /* push the input to the bottom */
  margin-top: auto !important;
}
</style>