import Vue from 'vue';

function getByPath(obj: any, path: string) {
  return path.split('.').reduce((o: any, p: string) => (o ? o[p] : undefined), obj);
}

function setByPath(obj: any, path: string, val: any) {
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((o: any, p: string) => (o ? o[p] : undefined), obj);
  if (target && last) target[last] = val;
}

/**
 * createClickOffMixin(openPropPath)
 * - openPropPath: dot-separated path on `this` that resolves to a boolean controlling visibility
 * Usage: add the mixin to a component and provide the path to the boolean (e.g. 'preferencesPanelOpen' or 'ui.gamesetup_detail_open')
 */
export function createClickOffMixin(openPropPath: string) {
  return Vue.extend({
    data() {
      return {
        _clickOffHandler: null as unknown as (e: Event) => void,
      };
    },
    mounted() {
      this._clickOffHandler = (e: Event) => {
        try {
          const open = getByPath(this, openPropPath);
          if (!open) return;
          const el = this.$el as HTMLElement | null;
          if (!el) return;
          const target = e.target as Node | null;
          if (!target) return;
          if (!el.contains(target)) {
            setByPath(this, openPropPath, false);
          }
        } catch (err) {
          // ignore errors and avoid breaking the app
        }
      };
      // Use bubble phase so component clicks that toggle open run first
      document.addEventListener('click', this._clickOffHandler, false);
    },
    beforeDestroy() {
      if (this._clickOffHandler) document.removeEventListener('click', this._clickOffHandler, false);
    },
  } as any);
}
