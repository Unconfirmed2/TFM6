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
    async loadMessages() {
      try {
        const url = paths.API_CHAT + '?id=' + this.playerView.id + 
          (this.lastMessageId ? '&since=' + this.lastMessageId : '');
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          
          if (data.messages && data.messages.length > 0) {
            const hasNewMessages = data.messages.some((msg: ChatMessage) => msg.playerId !== this.playerView.id);
            this.messages.push(...data.messages);
            this.lastMessageId = data.lastMessageId;
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
          this.loadMessages();
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
  },
  mounted() {
    this.loadMessages();
    
    // Set up auto-refresh for chat messages every 3 seconds
    const interval = setInterval(() => {
      this.checkForUpdates();
    }, 3000);
    
    // Clean up interval on component destroy
    this.$once('hook:beforeDestroy', () => {
      clearInterval(interval);
    });
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
  z-index: 1100;
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
</style>