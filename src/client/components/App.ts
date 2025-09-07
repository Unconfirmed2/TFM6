import * as constants from '@/common/constants';
import * as raw_settings from '@/genfiles/settings.json';
import AdminHome from '@/client/components/admin/AdminHome.vue';
import CardList from '@/client/components/cardlist/CardList.vue';
import CreateGameForm from '@/client/components/create/CreateGameForm.vue';
import GameEnd from '@/client/components/GameEnd.vue';
import GameHome from '@/client/components/GameHome.vue';
import GamesOverview from '@/client/components/GamesOverview.vue';
import Help from '@/client/components/help/Help.vue';
import LoginHome from '@/client/components/auth/LoginHome.vue';
import LoadGameForm from '@/client/components/LoadGameForm.vue';
import PlayerHome from '@/client/components/PlayerHome.vue';
import PlayerInputFactory from '@/client/components/PlayerInputFactory.vue';
import SpectatorHome from '@/client/components/SpectatorHome.vue';
import StartScreen from '@/client/components/StartScreen.vue';
import {$t, setTranslationContext} from '@/client/directives/i18n';
import {paths} from '@/common/app/paths';
import {PlayerViewModel, ViewModel} from '@/common/models/PlayerModel';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import {SpectatorModel} from '@/common/models/SpectatorModel';
import {isPlayerId, isSpectatorId} from '@/common/Types';
import {hasShowModal, showModal, windowHasHTMLDialogElement} from './HTMLDialogElementCompatibility';
import {statusCode} from '@/common/http/statusCode';

const dialogPolyfill = require('dialog-polyfill');

type Screen = 'admin' |
            'create-game-form' |
            'cards' |
            'empty' |
            'game-home' |
            'games-overview' |
            'help' |
            'load' |
            'login-home' |
            'player-home' |
            'spectator-home' |
            'start-screen' |
            'the-end';
export interface MainAppData {
    screen: Screen;
    /**
     * player or spectator are set once the app component has loaded.
     * Vue only watches properties that exist initially. When we
     * use this property we can't trigger vue state without
     * a refactor.
     */
    spectator?: SpectatorModel;
    playerView?: PlayerViewModel;
    // playerKey might seem to serve no function, but it's basically an arbitrary value used
    // to force a rerender / refresh.
    // See https://michaelnthiessen.com/force-re-render/
    playerkey: number;
    settings: typeof raw_settings;
    isServerSideRequestInProgress: boolean;
    componentsVisibility: {[x: string]: boolean};
    game: SimpleGameModel | undefined;
    login: string | undefined;
}

const data: MainAppData = {
  screen: 'empty',
  playerkey: 0,
  settings: raw_settings,
  isServerSideRequestInProgress: false,
  componentsVisibility: {
    'milestones': true,
    'awards_list': true,
    'tags_concise': false,
    'pinned_player_0': true,
    'pinned_player_1': true,
    'pinned_player_2': true,
    'pinned_player_3': true,
    'pinned_player_4': true,
    'pinned_player_5': true,
    'pinned_player_6': true,
    'turmoil_parties': false,
  } as {[x: string]: boolean},
  game: undefined as SimpleGameModel | undefined,
  playerView: undefined,
  spectator: undefined,
  login: undefined,
};

export const mainAppSettings = {
  'el': '#app',
  'data': data,
  'components': {
    // These component keys match the screen values, and their entries in index.html.
    'player-input-factory': PlayerInputFactory,
    'start-screen': StartScreen,
    'create-game-form': CreateGameForm,
    'load-game-form': LoadGameForm,
    'game-home': GameHome,
    'player-home': PlayerHome,
    'spectator-home': SpectatorHome,
    'game-end': GameEnd,
    'games-overview': GamesOverview,
    'card-list': CardList,
    'help': Help,
    'admin-home': AdminHome,
    'login-home': LoginHome,
  },
  'methods': {
    showAlert(message: string, cb: () => void = () => {}): void {
      const dialogElement: HTMLElement | null = document.getElementById('alert-dialog');
      const buttonElement: HTMLElement | null = document.getElementById('alert-dialog-button');
      const messageElement: HTMLElement | null = document.getElementById('alert-dialog-message');
      if (buttonElement !== null && messageElement !== null && dialogElement !== null && hasShowModal(dialogElement)) {
        messageElement.innerHTML = $t(message);
        const handler = () => {
          buttonElement.removeEventListener('click', handler);
          cb();
        };
        buttonElement.addEventListener('click', handler);
        showModal(dialogElement);
      } else {
        alert(message);
        cb();
      }
    },
    setVisibilityState(targetVar: string, isVisible: boolean) {
      if (isVisible === this.getVisibilityState(targetVar)) return;
      (this as unknown as MainAppData).componentsVisibility[targetVar] = isVisible;
    },
    getVisibilityState(targetVar: string): boolean {
      return (this as unknown as MainAppData).componentsVisibility[targetVar] ? true : false;
    },
    update(path: typeof paths.PLAYER | typeof paths.SPECTATOR): void {
      const currentPathname = getLastPathSegment();
      const xhr = new XMLHttpRequest();
      const app = this as unknown as MainAppData;

      const url = 'api/' + path + window.location.search.replace('&noredirect', '');
      xhr.open('GET', url);
      xhr.onerror = function() {
        alert('Error getting game data');
      };
      xhr.onload = function() {
        try {
          if (xhr.status === statusCode.ok) {
            const model = xhr.response as ViewModel;
            if (path === paths.PLAYER) {
              app.playerView = model as PlayerViewModel;
              setTranslationContext(app.playerView);
            } else if (path === paths.SPECTATOR) {
              app.spectator = model as SpectatorModel;
            }
            app.playerkey++;
            if (
              model.game.phase === 'end' &&
              window.location.search.includes('&noredirect') === false
            ) {
              app.screen = 'the-end';
              if (currentPathname !== paths.THE_END) {
                window.history.replaceState(
                  xhr.response,
                  `${constants.APP_NAME} - Player`,
                  `${paths.THE_END}?id=${model.id}`,
                );
              }
            } else {
              if (path === paths.PLAYER) {
                app.screen = 'player-home';
              } else if (path === paths.SPECTATOR) {
                app.screen = 'spectator-home';
              }
              if (currentPathname !== path) {
                window.history.replaceState(
                  xhr.response,
                  `${constants.APP_NAME} - Game`,
                  `${path}?id=${model.id}`,
                );
              }
            }
          } else {
            alert('Unexpected server response: ' + xhr.statusText);
          }
        } catch (e) {
          console.log('Error processing XHR response: ' + e);
        }
      };
      xhr.responseType = 'json';
      xhr.send();
    },
    updatePlayer() {
      this.update(paths.PLAYER);
    },
    updateSpectator: function() {
      this.update(paths.SPECTATOR);
    },
  },
  mounted() {
    document.title = constants.APP_NAME;
    if (!windowHasHTMLDialogElement()) {
      dialogPolyfill.default.registerDialog(document.getElementById('alert-dialog'));
    }
    const currentPathname = getLastPathSegment();
    const app = this as unknown as (MainAppData) & (typeof mainAppSettings.methods);
    if (currentPathname === paths.PLAYER) {
      app.updatePlayer();
    } else if (currentPathname === paths.THE_END) {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id') || '';
      if (isPlayerId(id)) {
        app.updatePlayer();
      } else if (isSpectatorId(id)) {
        app.updateSpectator();
      } else {
        alert('Bad id URL parameter.');
      }
    } else if (currentPathname === paths.GAME) {
      app.screen = 'game-home';
      const xhr = new XMLHttpRequest();
      xhr.open('GET', paths.API_GAME + window.location.search);
      xhr.onerror = function() {
        alert('Error getting game data');
      };
      xhr.onload = function() {
        if (xhr.status === statusCode.ok) {
          window.history.replaceState(
            xhr.response,
            `${constants.APP_NAME} - Game`,
            `${paths.GAME}?id=${xhr.response.id}`,
          );
          app.game = xhr.response as SimpleGameModel;
        } else {
          alert('Unexpected server response');
        }
      };
      xhr.responseType = 'json';
      xhr.send();
    } else if (currentPathname === paths.GAMES_OVERVIEW) {
      app.screen = 'games-overview';
    } else if (currentPathname === paths.NEW_GAME) {
      app.screen = 'create-game-form';
    } else if (currentPathname === paths.LOAD) {
      app.screen = 'load';
    } else if (currentPathname === paths.CARDS) {
      app.screen = 'cards';
    } else if (currentPathname === paths.HELP) {
      app.screen = 'help';
    } else if (currentPathname === paths.SPECTATOR) {
      app.updateSpectator();
    } else if (currentPathname === paths.ADMIN) {
      app.screen = 'admin';
    } else if (currentPathname === paths.LOGIN) {
      app.screen = 'login-home';
    } else {
      app.screen = 'start-screen';
    }

    // Debug helper: if URL contains ?btnDebug=1, show a small badge that
    // displays the isServerSideRequestInProgress flag and allows clearing it.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('btnDebug') === '1') {
        const badge = document.createElement('div');
        badge.id = 'btn-debug-badge';
        badge.style.position = 'fixed';
        badge.style.right = '8px';
        badge.style.bottom = '8px';
        badge.style.padding = '8px 10px';
        badge.style.background = 'rgba(0,0,0,0.7)';
        badge.style.color = 'white';
        badge.style.fontSize = '12px';
        badge.style.zIndex = '9999';
        badge.style.borderRadius = '6px';
        badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        badge.style.pointerEvents = 'auto';

        const txt = document.createElement('div');
        txt.id = 'btn-debug-text';
        txt.style.marginBottom = '6px';
        badge.appendChild(txt);

        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear Busy';
        clearBtn.style.fontSize = '12px';
        clearBtn.style.padding = '4px 6px';
        clearBtn.style.cursor = 'pointer';
        clearBtn.onclick = () => {
          try {
            (app as unknown as MainAppData).isServerSideRequestInProgress = false;
            updateText();
          } catch (e) {
            // ignore
          }
        };
        badge.appendChild(clearBtn);

        document.body.appendChild(badge);

        function updateText() {
          try {
            const val = ((app as unknown as MainAppData).isServerSideRequestInProgress) ? 'true' : 'false';
            (document.getElementById('btn-debug-text') as HTMLElement).innerText = 'serverBusy: ' + val;
          } catch (e) {
            // ignore
          }
        }

        updateText();
        setInterval(updateText, 500);
      }
    } catch (e) {
      // ignore any debug setup errors
    }
  },
};

// NOTE: this simplistic truncation to the last segment might cause issues if
// this page starts supporting paths more than one level deep.
function getLastPathSegment() {
  // Leave only the last part of /path
  return window.location.pathname.replace(/.*\//g, '');
}
