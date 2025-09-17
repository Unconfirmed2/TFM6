<template>
  <div class="fixed-dock-host" ref="host">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'fixed-dock-host',
  mounted() {
    const el = (this.$refs.host as HTMLElement);
    if (el && el.parentElement) {
      // Move the host element to document.body so it's outside other containers
      document.body.appendChild(el);
    }
    // set --vh custom property to account for mobile browser UI and zoom
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    (this as any)._setVh = setVh;
  },
  beforeDestroy() {
    const el = (this.$refs.host as HTMLElement);
    if (el && el.parentElement === document.body) {
      document.body.removeChild(el);
    }
    if ((this as any)._setVh) {
      window.removeEventListener('resize', (this as any)._setVh);
      (this as any)._setVh = undefined;
    }
  },
});
</script>

<style scoped>
.fixed-dock-host { display: block; }
</style>
