<template>
  <div :class="'section-container section-' + sectionType"
       :data-section-index="index"
       :data-section-type="sectionType">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'PlayerHomeSectionContainer',
  props: {
    sectionType: {
      type: String,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
  },
});
</script>

<style>
.section-container {
  width: 100%;
}

.section-container[data-section-type="board"] {
  /* Board-specific styling if needed */
}

.section-container[data-section-type="actions"] {
  /* Actions-specific styling if needed */
}

.section-container[data-section-type="cards"] {
  /* Cards-specific styling if needed */
}

.section-container[data-section-type="colonies"] {
  /* Colonies-specific styling if needed */
}

.section-container[data-section-type="log"] {
  /* Log-specific styling if needed */
}
</style>
