<template>
  <div class="docked-chat-panel">
    <!-- Render a fresh ChatComponent instance so this is a true duplication -->
    <chat-component :playerView="playerView" :players="players" @new-message="$emit('new-message')" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import ChatComponent from '@/client/components/ChatComponent.vue';

export default Vue.extend({
  name: 'docked-chat-panel',
  components: { 'chat-component': ChatComponent },
  props: {
    playerView: { type: Object, required: true },
    players: { type: Array, required: true },
  },
});
</script>

<style scoped>
.docked-chat-panel {
  width: 100%;
  box-sizing: border-box;
}
</style>
