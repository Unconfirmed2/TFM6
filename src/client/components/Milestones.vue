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
/* Hardcoded layout for milestones and awards inside Milestones
   - Header uses .ma-clickable width (ma-block reference): 105px
   - Container width (CW) fixed at 600px (Option B)
   - Gap between items: 8px (use existing .milestones_cont gap)
   - Milestone Item (MI) width: 147.33px (computed for CW=600)
   - MI margins: 4px left + 4px right
   - Apply same sizing to milestone inline items (paid/unpaid) so layout matches
*/
.milestones .ma-clickable {
  width: 105px !important;
  box-sizing: border-box;
}

/* ensure the milestones title row uses the same flex+gap layout as awards */
.milestones .ma-title {
  display: inline-flex !important;
  gap: 8px !important;
  align-items: center !important;
}

.milestones .ma-title .ma-clickable {
  margin-left: 5px !important;
}

/* make the milestones container use the same inline-flex layout as awards */
.milestones_cont {
  display: inline-flex !important;
  gap: 8px !important;
  align-items: stretch !important;
}

/* Reduce text size in the Milestones Row (MR) by ~20% (rounded) */
/* Original sizes: .ma-clickable 16px -> 13px; .milestone-award-inline 14px -> 11px; .ma-name/.ma-description/.ma-score 11px -> 9px; .milestone-award-price 18px -> 14px */
.milestones_cont .ma-clickable,
.awards_cont .ma-clickable {
  font-size: 13px !important;
}

.milestones_cont .milestone-award-inline,
.milestones_cont .milestone-award-inline.paid,
.milestones_cont .milestone-award-inline.unpaid,
.awards_cont .milestone-award-inline {
  font-size: 11px !important;
}

.milestones_cont ::v-deep .ma-name,
.awards_cont .ma-name,
.milestones_cont ::v-deep .ma-description,
.awards_cont .ma-description,
.milestones_cont ::v-deep .ma-score,
.awards_cont .ma-score {
  font-size: 9px !important;
}

.milestones_cont .milestone-award-price,
.awards_cont .milestone-award-price {
  font-size: 14px !important;
}

/* target both milestones and generic awards containers */
.milestones_cont .awards_cont,
.awards_cont {
  width: 600px !important;
  gap: 8px !important;
  display: inline-flex !important;
  align-items: center;
  box-sizing: border-box;
}

/* Milestone items (use ma-block on both milestones and awards) */
.milestones_cont .awards_cont ::v-deep .ma-block,
.awards_cont ::v-deep .ma-block {
  width: 143px !important;
  margin: 0 !important; /* rely on container gap, remove duplicated margins */
  box-sizing: border-box;
}

/* Apply same visual width/gaps to paid/unpaid milestone inline items */
.milestones .milestone-award-inline,
.milestones .milestone-award-inline.paid,
.milestones .milestone-award-inline.unpaid {
  width: 143px !important;
  margin: 0 !important; /* remove external margin - container gap handles spacing */
  box-sizing: border-box;
  display: inline-flex !important;
  justify-content: center;
  align-items: center;
  padding: 2px 4px !important; /* reduced internal padding */
}

/* Make all MR items a fixed smaller height (22px) */
.milestones_cont .milestone-award-inline,
.awards_cont .milestone-award-inline,
.milestones_cont .milestone-award-inline.paid,
.milestones_cont .milestone-award-inline.unpaid,
.milestones_cont ::v-deep .ma-block,
.awards_cont ::v-deep .ma-block,
.milestones_cont .ma-clickable,
.awards_cont .ma-clickable {
  min-height: 22px !important;
  line-height: 22px !important;
  align-items: center !important;
  box-sizing: border-box;
}

/* Milestone Badge (MB) adjustments: remove margins and set MB to 18px */
.milestones_cont ::v-deep .ma-score,
.awards_cont .ma-score,
.milestones ::v-deep .ma-score {
  margin: 0 !important;
  padding: 0 !important;
  width: 18px !important; /* MB set to 18px */
  height: 18px !important;
  line-height: 18px !important;
  border-radius: 3px !important;
  box-sizing: border-box;
  font-size: 10px !important;
  text-align: center !important;
  /* ensure any background icons scale to the badge size */
  background-size: 18px 18px !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}

/* remove the small left offset on the player cube when inside the inline milestone element */
.milestones .milestone-award-inline .ma-player-cube .board-cube {
  margin-left: 0 !important;
}

/* override the large left margin used for milestone-award-price so it doesn't push content */
.milestones .milestone-award-price,
.awards_cont .milestone-award-price {
  margin: 0 !important;
  padding: 0 !important;
  width: 18px !important;
  height: 18px !important;
  line-height: 18px !important;
  font-size: 10px !important;
  box-sizing: border-box;
  text-align: center !important;
  background-size: 18px 18px !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}

/* Prevent parent clipping of small badge icons */
.milestones .milestone-award-inline,
.milestones_cont ::v-deep .ma-block,
.milestones ::v-deep .ma-name,
.awards_cont ::v-deep .ma-block,
.awards_cont .ma-name {
  overflow: visible !important;
}

/* Nudge .ma-name up by 3px to visually align names with badges */
.milestones_cont ::v-deep .ma-name,
.awards_cont .ma-name,
.milestones ::v-deep .ma-name {
  position: relative !important;
  top: -3px !important;
}
</style>
