import { FunctionalComponent, h } from 'preact';
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
import { PodcastService } from '../core/services';

const App: FunctionalComponent = () => {
  useEffect(() => {
    if (window.location.href.includes('index.html')) {
      route('/podcasts');
    }

    const podcastService = new PodcastService();
    // podcastService.checkForUpdates();
  }, []);

  useNavKeys({
    Backspace: (ev) => {
      console.log('root backspace');
    },
  });

  return (
    <div id="preact_root">
      <PlayerProvider>
        <Router>
          <Route path="/search" component={Search} />
          <Route path="/podcast/:podcastId" component={PodcastDetail} />
          <Route
            path="/podcast/:podcastId/preview"
            component={PodcastPreview}
          />
          <Route path="/episode/:episodeId" component={EpisodeDetail} />
          <Route path="/filter/:filterId" component={Filter} />
          <Route path="/player" component={Player} />
          <Route path="/podcasts" component={Podcasts} default={true} />
        </Router>
      </PlayerProvider>
    </div>
  );
};

export default App;