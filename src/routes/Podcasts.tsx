import { Fragment, h, VNode } from 'preact';
import { route } from 'preact-router';
import { useState, useEffect } from 'preact/hooks';
import { ListItem, View } from '../ui-components';
import { setSelected } from '../utils/navigation';
import { useDpad } from '../hooks/useDpad';
import { GridItem } from '../ui-components/GridItem';
import styles from './Podcasts.module.css';
import { useSettings } from '../contexts/SettingsProvider';
import { OpmlFeed, PodcastsLayout } from '../models';
import { Podcast } from 'foxcasts-core/lib/types';
import { Core } from '../services/core';
import { OPML } from '../services/opml';
import { useToast } from '../contexts/ToastProvider';
import { KaiOS } from '../services/kaios';

interface Props {
  selectedItemId?: string;
}

export default function Podcasts({ selectedItemId }: Props): VNode {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [seeding, setSeeding] = useState(false);

  const { settings } = useSettings();
  const { showToast } = useToast();

  useEffect(() => {
    Core.getPodcasts().then((result) => {
      setPodcasts(result);
    });
  }, []);

  /// Restore scroll position
  useEffect(() => {
    if (!selectedItemId) return;
    setSelected(selectedItemId, true);
  }, [selectedItemId, podcasts]);

  function viewPodcast(podcastId: string | number): void {
    route(`/podcast/${podcastId}`);
  }

  useDpad({
    onEnter: (itemId) => viewPodcast(itemId),
    onChange: (itemId) => {
      if (itemId) {
        route(`/podcasts/?selectedItemId=${itemId}`, true);
      } else {
        route(`/podcasts/`, true);
      }
    },
  });

  async function seedData(): Promise<void> {
    setSeeding(true);
    try {
      // Need to do one at a time so KaiOS can handle it
      await Core.subscribeByFeedUrl('https://feed.syntax.fm/rss');
      await Core.subscribeByFeedUrl('https://shoptalkshow.com/feed/podcast');
      await Core.subscribeByFeedUrl('https://feeds.simplecast.com/JoR28o79'); // React Podcast
      await Core.subscribeByFeedUrl(
        'https://feeds.feedwrench.com/js-jabber.rss'
      );
      await Core.subscribeByFeedUrl('https://feeds.megaphone.fm/vergecast');

      console.log('seed success');
    } catch (err) {
      console.error('Failed to seed data', err);
    }

    Core.getPodcasts().then((result) => {
      setPodcasts(result);
    });

    setSeeding(false);
  }

  async function exportFeeds(): Promise<void> {
    if (!podcasts) return;

    const storageName = KaiOS.storage.getActualStorageName('sdcard');
    const feeds: OpmlFeed[] = podcasts.map((a, i) => ({
      id: i.toString(),
      type: 'rss',
      text: a.title,
      xmlUrl: a.feedUrl,
      description: null,
      htmlUrl: null,
      language: null,
      title: null,
      version: null,
    }));
    OPML.create(`/${storageName}/foxcasts_${new Date().valueOf()}.opml`, feeds)
      .then((res) =>
        showToast(`Successfully exported feeds to ${res.filePath}`)
      )
      .catch(() => showToast(`Failed to export feeds.`));
  }

  async function handleAction(action: string): Promise<void> {
    switch (action) {
      case 'seed':
        await seedData();
        break;
      case 'import':
        route('/files');
        break;
      case 'export':
        exportFeeds();
        break;
    }
  }

  return (
    <View
      headerText="Podcasts"
      actions={[
        // {
        //   id: 'seed',
        //   label: seeding ? 'Seeding...' : 'Seed podcasts',
        //   disabled: seeding,
        // },
        {
          id: 'import',
          label: 'Import OPML',
        },
        {
          id: 'export',
          label: 'Export as OPML',
        },
      ]}
      onAction={handleAction}
    >
      {settings.podcastsLayout === PodcastsLayout.List ? (
        <Fragment>
          {podcasts.map((podcast, i) => (
            <ListItem
              key={podcast.id}
              itemId={podcast.id}
              imageUrl={podcast.artwork}
              primaryText={podcast.title}
              shortcutKey={i <= 8 ? i + 1 : undefined}
              onClick={(): void => viewPodcast(podcast.id)}
            />
          ))}
        </Fragment>
      ) : (
        <div className={styles.grid}>
          {podcasts.map((podcast, i) => (
            <GridItem
              key={podcast.id}
              itemId={podcast.id}
              dimIfUnselected={!!selectedItemId}
              imageUrl={podcast.artwork}
              shortcutKey={i + 1}
              onClick={(): void => viewPodcast(podcast.id)}
            />
          ))}
        </div>
      )}
    </View>
  );
}
