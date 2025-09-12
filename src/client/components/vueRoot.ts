import {CombinedVueInstance} from 'vue/types/vue';
import {mainAppSettings} from '@/client/components/App';

// Gives caller access to global client methods and data.
//
// This app's top level is probably not using a standard pattern, so some of this is
// just messy. But at least this method simplifies access.
export function vueRoot(component: CombinedVueInstance<any, any, any, any, any>): typeof mainAppSettings.methods & typeof mainAppSettings.data {
  return component.$root as unknown as (typeof mainAppSettings.methods & typeof mainAppSettings.data);
}

// Initialize card zoom UI enhancements
try {
  // lazy import to avoid affecting server-side builds
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cardZoom = require('@/client/card-zoom');
  if (cardZoom && typeof cardZoom.initCardZoom === 'function') cardZoom.initCardZoom();
} catch (e) {
  // ignore in environments where DOM is not present
}
