<template>
  <div class="sidebar_item sidebar_item--settings" :title="$t('Player Settings')">
  <i class="sidebar_icon sidebar_icon--settings" :class="{'sidebar_item--is-active': preferencesPanelOpen}" v-on:click="togglePreferencesPanel"></i>
  <preferences-dialog v-show="preferencesPanelOpen" @okButtonClicked="closePreferencesPanel" :preferencesManager="preferencesManager"/>
  </div>
</template>

<script lang="ts">

import Vue from 'vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import PreferencesDialog from '@/client/components/PreferencesDialog.vue';

export default Vue.extend({
  name: 'PreferencesIcon',
  components: {
    'preferences-dialog': PreferencesDialog,
  },
  data() {
    const pm = require('@/client/utils/PreferencesManager').PreferencesManager.INSTANCE.values();
    return {
      preferencesPanelOpen: (pm as any).preferences_panel_open || false,
    };
  },
  computed: {
    preferencesManager(): PreferencesManager {
      return PreferencesManager.INSTANCE;
    },
  },
  methods: {
    togglePreferencesPanel() {
      this.preferencesPanelOpen = !this.preferencesPanelOpen;
      PreferencesManager.INSTANCE.set('preferences_panel_open', this.preferencesPanelOpen);
    },
    closePreferencesPanel() {
      this.preferencesPanelOpen = false;
      PreferencesManager.INSTANCE.set('preferences_panel_open', false);
    },
  },
});

</script>
