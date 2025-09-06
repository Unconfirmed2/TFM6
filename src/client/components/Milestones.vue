<template>
  <div class="milestones_cont" v-trim-whitespace>
    <div class="milestones">
      <div class="ma-title">
        <a @click.prevent="toggleList" class="ma-clickable milestones-padding" href="#" data-test="toggle-milestones" v-i18n>Milestones</a>
        <span
          v-for="milestone in fundedMilestones"
          :key="milestone.name"
          :title="milestone.playerName"
          class="milestone-award-inline paid"
          data-test="funded-milestones"
        >
          <span v-i18n>{{ milestone.name }}</span>
          <span class="ma-player-cube">
            <i
              class="board-cube"
              :class="`board-cube--${milestone.playerColor}`"
              :data-test-player-cube="milestone.playerColor"
            />
          </span>
        </span>

        <template v-if="isLearnerModeOn">
          <span
            v-for="spotPrice in availableMilestoneSpots"
            :key="spotPrice"
            class="milestone-award-inline unpaid"
          >
            <div class="milestone-award-price" data-test="spot-price" v-text="spotPrice" />
          </span>
        </template>
      </div>

      <span @click="toggleDescription" :title="$t('press to show or hide the description')" data-test="toggle-description">
        <div v-show="showMilestoneDetails">
          <Milestone
            v-for="milestone in milestones"
            :key="milestone.name"
            :milestone="milestone"
            :showScores="showScores"
            :showDescription="showDescription"
          />
        </div>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Milestone from '@/client/components/Milestone.vue';
import {MAX_MILESTONES, MILESTONE_COST} from '@/common/constants';
import {ClaimedMilestoneModel} from '@/common/models/ClaimedMilestoneModel';
import {Preferences, PreferencesManager} from '@/client/utils/PreferencesManager';

export default Vue.extend({
  name: 'Milestones',
  components: {Milestone},
  props: {
    milestones: {
      type: Array as () => Array<ClaimedMilestoneModel>,
      required: true,
    },
    showScores: {
      type: Boolean,
      default: true,
    },
    preferences: {
      type: Object as () => Readonly<Preferences>,
      default: () => PreferencesManager.INSTANCE.values(),
    },
  },
  data() {
    return {
      showMilestoneDetails: this.preferences?.show_milestone_details,
      showDescription: false,
    };
  },
  methods: {
    toggleList() {
      this.showMilestoneDetails = !this.showMilestoneDetails;
      PreferencesManager.INSTANCE.set('show_milestone_details', this.showMilestoneDetails);
    },
    toggleDescription() {
      this.showDescription = !this.showDescription;
    },

  },
  computed: {
    fundedMilestones(): ClaimedMilestoneModel[] {
      const isFunded = (milestone: ClaimedMilestoneModel) => !!milestone.playerName;
      return this.milestones.filter(isFunded);
    },
    availableMilestoneSpots(): Number[] {
      return Array(MAX_MILESTONES - this.fundedMilestones.length).fill(MILESTONE_COST);
    },
    isLearnerModeOn(): boolean {
      return this.preferences.learner_mode;
    },
  },
});
</script>

<style scoped>
/* Root CSS now handles all alignment - keeping only Vue-specific overrides if needed */
</style>
