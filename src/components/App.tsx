import { h, VNode } from 'preact';
import { route, Route, Router } from 'preact-router';
import { useEffect } from 'preact/hooks';
import { PlayerProvider } from '../contexts/playerContext';
import EpisodeDetail from '../routes/EpisodeDetail';
import Filter from '../routes/Filter';
import Player from '../routes/Player';
import PodcastDetail from '../routes/PodcastDetail';
import PodcastPreview from '../routes/PodcastPreview';
import Search from '../routes/Search';
import Podcasts from '../routes/Podcasts';
import { useNavKeys } from '../hooks/useNavKeys';
import { checkForUpdates } from '../core/services/podcasts';
import AppSettings from '../routes/AppSettings';
import { SettingsProvider, useSettings } from '../contexts/SettingsProvider';
import { DisplayDensity } from '../models';
import { themes } from '../themes';

export function AppWrapper(): VNode {
  return (
    <div id="preact_root">
      <SettingsProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </SettingsProvider>
    </div>
  );
}

export default function App(): VNode {
  const { settings } = useSettings();

  useEffect(() => {
    if (window.location.href.includes('index.html')) {
      route('/podcasts');
    }

    checkForUpdates();
  }, []);

  useEffect(() => {
    const theme = themes.find((a) => a.id === settings.theme) || themes[0];
    for (const id in theme.values) {
      document.body.style.setProperty(
        `--${theme.values[id].variable}`,
        theme.values[id].value
      );
    }

    document.body.style.setProperty(
      '--app-accent-color',
      `#${settings.accentColor}`
    );
    document.body.style.setProperty(
      '--accent-text-color',
      `#${settings.accentColor}`
    );
    document.body.style.setProperty(
      '--highlight-bg-color',
      `#${settings.accentColor}`
    );
    document.body.style.setProperty(
      '--header-bg-color',
      `#${settings.accentColor}`
    );
  }, [settings.theme, settings.accentColor]);

  useEffect(() => {
    if (settings.displayDensity === DisplayDensity.Compact) {
      document.body.setAttribute('data-compact-layout', '');
    } else {
      document.body.removeAttribute('data-compact-layout');
    }
  }, [settings.displayDensity]);

  useNavKeys({
    Backspace: (ev) => {
      console.log('root backspace');
    },
  });

  return (
    <Router>
      <Route path="/search" component={Search} />
      <Route path="/search/:podcastStoreId" component={PodcastPreview} />
      <Route path="/podcast/:podcastId" component={PodcastDetail} />
      <Route path="/episode/:episodeId" component={EpisodeDetail} />
      <Route path="/filter/:filterId" component={Filter} />
      <Route path="/player" component={Player} />
      <Route path="/settings" component={AppSettings} />
      <Route path="/podcasts" component={Podcasts} default={true} />
    </Router>
  );
}
