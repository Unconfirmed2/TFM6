export type Preferences = {
  learner_mode: boolean,
  enable_sounds: boolean,
  magnify_cards: boolean,
  show_alerts: boolean,
  hide_hand: boolean,
  hide_awards_and_milestones: boolean,
  show_milestone_details: boolean,
  show_award_details: boolean,
  hide_top_bar: boolean,
  small_cards: boolean,
  small_colonies: boolean,
  remove_background: boolean,
  hide_active_cards: boolean,
  hide_automated_cards: boolean,
  hide_event_cards: boolean,
  hide_tile_confirmation: boolean,
  hide_discount_on_cards: boolean,
  hide_animated_sidebar: boolean,
  header_sticky: boolean,
  debug_view: boolean,
  symbol_overlay: boolean,
  experimental_ui: boolean,
  lang: string,
  section_order: number[],
  
  // UI state that should persist across component remounting
  chat_visible: boolean,
  board_scale: number,
  other_player_group_modes: {[key: string]: string},
}

export type Preference = keyof Preferences;

const defaults: Preferences = {
  learner_mode: true,
  enable_sounds: true,
  magnify_cards: true,
  show_alerts: true,
  lang: 'en',

  hide_hand: false,
  hide_awards_and_milestones: false,
  show_milestone_details: true,
  show_award_details: true,
  hide_top_bar: false,
  small_cards: false,
  small_colonies: false,
  remove_background: false,
  hide_active_cards: false,
  hide_automated_cards: false,
  hide_event_cards: false,
  hide_tile_confirmation: false,
  hide_discount_on_cards: false,
  hide_animated_sidebar: false,

  // Make the top player overview sticky by default? false to match previous behaviour
  header_sticky: false,

  symbol_overlay: false,

  experimental_ui: false,
  debug_view: false,
  section_order: [1, 2, 3, 4, 5], // Board, Actions, Cards, Colonies, Log
  
  // UI state that should persist across component remounting
  chat_visible: true,
  board_scale: 1.0,
  other_player_group_modes: {
    corporation: 'grid',
    prelude: 'grid',
    ceo: 'grid',
    active_with_actions: 'grid',
    active_without_actions: 'grid',
    automated: 'stacked',
    event: 'hidden',
    self_replicating: 'stacked',
  },
};

export class PreferencesManager {
  public static INSTANCE = new PreferencesManager();
  private readonly _values: Preferences;

  private localStorageSupported(): boolean {
    return typeof localStorage !== 'undefined';
  }

  public static resetForTest() {
    this.INSTANCE = new PreferencesManager();
  }

  private constructor() {
    this._values = {...defaults};
    for (const key of Object.keys(defaults) as Array<Preference>) {
      const value = this.localStorageSupported() ? localStorage.getItem(key) : undefined;
      if (value) this._set(key, value);
    }
  }

  private _set(key: Preference, val: string | boolean | number[] | number | {[key: string]: string}) {
    if (key === 'lang') {
      this._values.lang = String(val);
    } else if (key === 'section_order') {
      this._values.section_order = Array.isArray(val) ? val : JSON.parse(String(val));
    } else if (key === 'board_scale') {
      this._values.board_scale = typeof(val) === 'number' ? val : parseFloat(String(val));
    } else if (key === 'other_player_group_modes') {
      this._values.other_player_group_modes = typeof(val) === 'object' ? val as {[key: string]: string} : JSON.parse(String(val));
    } else if (key === 'chat_visible') {
      this._values.chat_visible = typeof(val) === 'boolean' ? val : (val === '1' || val === 'true');
    } else {
      (this._values as any)[key] = typeof(val) === 'boolean' ? val : (val === '1');
    }
  }

  // Making this Readonly means that it's Typescript-impossible to
  // set preferences through the fields themselves.
  values(): Readonly<Preferences> {
    return this._values;
  }

  set(name: Preference, val: string | boolean | number[] | number | {[key: string]: string}, setOnChange = false): void {
    // Don't set values if nothing has changed.
    if (setOnChange && this._values[name] === val) return;
    this._set(name, val);
    if (this.localStorageSupported()) {
      if (name === 'lang') {
        localStorage.setItem(name, this._values.lang);
      } else if (name === 'section_order') {
        localStorage.setItem(name, JSON.stringify(this._values.section_order));
      } else if (name === 'board_scale') {
        localStorage.setItem(name, String(this._values.board_scale));
      } else if (name === 'other_player_group_modes') {
        localStorage.setItem(name, JSON.stringify(this._values.other_player_group_modes));
      } else if (name === 'chat_visible') {
        localStorage.setItem(name, this._values.chat_visible ? '1' : '0');
      } else {
        localStorage.setItem(name, val ? '1' : '0');
      }
    }
  }
}

export function getPreferences(): Readonly<Preferences> {
  return PreferencesManager.INSTANCE.values();
}
