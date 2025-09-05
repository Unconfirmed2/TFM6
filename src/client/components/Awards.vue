<template>
  <div class="awards_cont" v-trim-whitespace>
    <div class="awards">
      <div class="ma-title">
        <a @click.prevent="toggleList" class="ma-clickable awards-padding" href="#" data-test="toggle-awards" v-i18n>Awards</a>
        <span
          v-for="award in fundedAwards"
          :key="award.name"
          :title="award.playerName"
          class="milestone-award-inline paid"
          data-test="funded-awards"
        >
          <span v-i18n>{{ award.name }}</span>
          <span class="ma-player-cube">
            <i
              class="board-cube"
              :class="`board-cube--${award.playerColor}`"
              :data-test-player-cube="award.playerColor"
            />
          </span>
        </span>

        <template v-if="isLearnerModeOn">
          <span
            v-for="spotPrice in availableAwardSpots"
            :key="spotPrice"
            class="milestone-award-inline unpaid"
          >
            <div class="milestone-award-price" data-test="spot-price" v-text="spotPrice" />
          </span>
        </template>
      </div>

      <span @click="toggleDescription" :title="$t('press to show or hide the description')" data-test="toggle-description">
        <div v-show="showAwardDetails">
          <Award
            v-for="award in awards"
            :key="award.name"
            :award="award"
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
import Award from '@/client/components/Award.vue';
import {AWARD_COSTS} from '@/common/constants';
import {FundedAwardModel} from '@/common/models/FundedAwardModel';
import {Preferences, PreferencesManager} from '@/client/utils/PreferencesManager';

export default Vue.extend({
  name: 'Awards',
  components: {Award},
  props: {
    awards: {
      type: Array as () => Array<FundedAwardModel>,
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
      showAwardDetails: this.preferences?.show_award_details,
      showDescription: false,
    };
  },
  methods: {
    toggleList() {
      this.showAwardDetails = !this.showAwardDetails;
      PreferencesManager.INSTANCE.set('show_award_details', this.showAwardDetails);
    },
    toggleDescription() {
      this.showDescription = !this.showDescription;
    },

  },
  computed: {
    fundedAwards(): FundedAwardModel[] {
      const isFunded = (award: FundedAwardModel) => !!award.playerName;
      return this.awards.filter(isFunded);
    },
    availableAwardSpots(): Number[] {
      return AWARD_COSTS.slice(this.fundedAwards.length);
    },
    isLearnerModeOn(): boolean {
      return this.preferences.learner_mode;
    },
  },
});
</script>

<style scoped>
/* Hardcoded layout for milestones and awards inside Awards
   - Header uses .ma-clickable width (ma-block reference): 105px
   - Container width (CW) fixed at 600px (Option B)
   - Gap between items: 8px (use existing .milestones_cont gap)
   - Milestone Item (MI) width: 147.33px (computed for CW=600)
   - MI margins: 4px left + 4px right
   - Apply same sizing to award inline items (paid/unpaid) so layout matches
*/
.awards .ma-clickable {
  width: 105px !important;
  box-sizing: border-box;
}

/* ensure the awards title row uses the same flex+gap layout as milestones */
.awards .ma-title {
  display: inline-flex !important;
  gap: 8px !important;
  align-items: center !important;
}

.awards .ma-title .ma-clickable {
  margin-left: 5px !important;
}

/* make the awards container use the same inline-flex layout as milestones */
.awards_cont {
  display: inline-flex !important;
  gap: 8px !important;
  align-items: stretch !important;
}

/* Reduce text size in the Milestones Row (MR) by ~20% (rounded) */
/* Original sizes: .ma-clickable 16px -> 13px; .milestone-award-inline 14px -> 11px; .ma-name/.ma-description/.ma-score 11px -> 9px; .milestone-award-price 18px -> 14px */
.awards_cont .ma-clickable,
.milestones_cont .ma-clickable {
  font-size: 13px !important;
}

.awards_cont .milestone-award-inline,
.awards_cont .milestone-award-inline.paid,
.awards_cont .milestone-award-inline.unpaid,
.milestones_cont .milestone-award-inline {
  font-size: 11px !important;
}

.awards_cont .ma-name,
.milestones_cont .ma-name,
.awards_cont .ma-description,
.milestones_cont .ma-description,
.awards_cont .ma-score,
.milestones_cont .ma-score {
  font-size: 9px !important;
}

.awards_cont .milestone-award-price,
.milestones_cont .milestone-award-price {
  font-size: 14px !important;
}

/* target both awards and generic milestones containers */
.awards_cont .milestones_cont,
.milestones_cont {
  width: 600px !important;
  gap: 8px !important;
  display: inline-flex !important;
  align-items: center;
  box-sizing: border-box;
}

/* Milestone items (use ma-block on both awards and milestones) */
.awards_cont .milestones_cont .ma-block,
.milestones_cont .ma-block {
  width: 143px !important;
  margin: 0 !important; /* rely on container gap, remove duplicated margins */
  box-sizing: border-box;
}

/* Apply same visual width/gaps to paid/unpaid award inline items */
.awards .milestone-award-inline,
.awards .milestone-award-inline.paid,
.awards .milestone-award-inline.unpaid {
  width: 143px !important;
  margin: 0 !important; /* remove external margin - container gap handles spacing */
  box-sizing: border-box;
  display: inline-flex !important;
  justify-content: center;
  align-items: center;
  padding: 2px 4px !important; /* reduced internal padding */
}

/* Make all MR items a fixed smaller height (22px) */
.awards_cont .milestone-award-inline,
.milestones_cont .milestone-award-inline,
.awards_cont .milestone-award-inline.paid,
.awards_cont .milestone-award-inline.unpaid,
.awards_cont .ma-block,
.milestones_cont .ma-block,
.awards_cont .ma-clickable,
.milestones_cont .ma-clickable {
  min-height: 22px !important;
  line-height: 22px !important;
  align-items: center !important;
  box-sizing: border-box;
}

/* Milestone Badge (MB) adjustments: remove margins and set MB to 18px */
.awards_cont .ma-score,
.milestones_cont .ma-score,
.awards .ma-score {
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

/* remove the small left offset on the player cube when inside the inline award element */
.awards .milestone-award-inline .ma-player-cube .board-cube {
  margin-left: 0 !important;
}

/* override the large left margin used for milestone-award-price so it doesn't push content */
.awards .milestone-award-price,
.milestones_cont .milestone-award-price {
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
.awards .milestone-award-inline,
.awards_cont .ma-block,
.awards .ma-name,
.milestones_cont .ma-block,
.milestones_cont .ma-name {
  overflow: visible !important;
}

/* Nudge .ma-name up by 3px to visually align names with badges */
.awards_cont .ma-name,
.milestones_cont .ma-name,
.awards .ma-name {
  position: relative !important;
  top: -3px !important;
}
</style>
