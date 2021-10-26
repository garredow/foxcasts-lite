import { Podcast } from 'foxcasts-core/lib/types';
import { h, VNode } from 'preact';
import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useSettings } from '../contexts/SettingsProvider';
import { ArtworkBlur } from '../enums/artworkBlur';
import { ArtworkSize } from '../enums/artworkSize';
import { useArtwork } from '../hooks/useArtwork';
import { useBodyScroller } from '../hooks/useBodyScroller';
import { usePodcastSettings } from '../hooks/usePodcastSettings';
import { Core, refreshArtwork } from '../services/core';
import { AppBar } from '../ui-components/appbar';
import { Typography } from '../ui-components/Typography';
import { View, ViewContent, ViewHeader, ViewTabs } from '../ui-components/view';

interface PodcastDetailProps {
  podcastId: string;
}

export default function PodcastInfo({ podcastId }: PodcastDetailProps): VNode {
  const [podcast, setPodcast] = useState<Podcast>();

  const { artwork } = useArtwork(podcastId, {
    size: ArtworkSize.Large,
    blur: ArtworkBlur.Some,
  });
  const { settings } = useSettings();
  const { settings: podcastSettings, setSetting } =
    usePodcastSettings(podcastId);

  useEffect(() => {
    Core.getPodcastById(parseInt(podcastId, 10)).then((result) =>
      setPodcast(result)
    );
  }, [podcastId]);

  useBodyScroller({});

  return (
    <View
      backgroundImageUrl={artwork?.image}
      accentColor={artwork?.palette?.[podcastSettings.accentColor]}
      enableCustomColor={true}
    >
      <ViewHeader>{podcast?.title}</ViewHeader>
      <ViewTabs
        tabs={[
          { id: 'episodes', label: 'episodes' },
          { id: 'info', label: 'podcast' },
        ]}
        selectedId="info"
        onChange={(tabId): boolean =>
          route(`/podcast/${podcastId}/${tabId}`, true)
        }
      />
      <ViewContent>
        <Typography type="title" padding="horizontal">
          {podcast?.title}
        </Typography>
        <Typography padding="horizontal" color="accent">
          {podcast?.author}
        </Typography>
        <Typography>{podcast?.description}</Typography>
      </ViewContent>
      <AppBar
        centerText="Select"
        options={
          settings.dynamicThemeColor
            ? [
                {
                  id: 'accentColor',
                  label: 'Accent Color',
                  currentValue: podcastSettings.accentColor,
                  options: [
                    { id: 'darkMuted', label: 'Dark Muted' },
                    { id: 'darkVibrant', label: 'Dark Vibrant' },
                    { id: 'lightMuted', label: 'Light Muted' },
                    { id: 'lightVibrant', label: 'Light Vibrant' },
                    { id: 'muted', label: 'Muted' },
                    { id: 'vibrant', label: 'Vibrant' },
                  ],
                },
              ]
            : []
        }
        actions={[
          {
            id: 'unsubscribe',
            label: 'Unsubscribe',
            actionFn: (): Promise<boolean> =>
              Core.unsubscribe(podcastId).then(() => route('/podcasts', true)),
          },
          {
            id: 'refreshArtwork',
            label: 'Refresh Artwork',
            actionFn: (): Promise<void> => refreshArtwork(podcastId),
          },
        ]}
        onOptionChange={setSetting}
      />
    </View>
  );
}
