import format from 'date-fns/format';
import { PlaybackStatus } from 'foxcasts-core/lib/enums';
import { Chapter, EpisodeExtended } from 'foxcasts-core/lib/types';
import { formatFileSize, formatTime } from 'foxcasts-core/lib/utils';
import { Fragment, h, VNode } from 'preact';
import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useDownloadManager } from '../contexts/DownloadManagerProvider';
import { usePlayer } from '../contexts/playerContext';
import { ArtworkBlur } from '../enums/artworkBlur';
import { ArtworkSize } from '../enums/artworkSize';
import { useArtwork } from '../hooks/useArtwork';
import { useListNav } from '../hooks/useListNav';
import { Core } from '../services/core';
import { AppBar, AppBarAction } from '../ui-components/appbar';
import { LabeledRow } from '../ui-components/LabeledRow';
import { ListItem } from '../ui-components/list';
import { Typography } from '../ui-components/Typography';
import { View, ViewTab, ViewTabBar } from '../ui-components/view';
import styles from './EpisodeDetail.module.css';

interface EpisodeDetailProps {
  episodeId: string;
  tabId: string;
}

export default function EpisodeDetail({
  episodeId,
  tabId,
}: EpisodeDetailProps): VNode {
  const [episode, setEpisode] = useState<EpisodeExtended>();
  const [chapters, setChapters] = useState<Chapter[] | null>();

  const player = usePlayer();
  const { addToQueue } = useDownloadManager();

  const { artwork } = useArtwork(episode?.podcastId, {
    size: ArtworkSize.Large,
    blur: ArtworkBlur.Some,
  });

  useEffect(() => {
    Core.getEpisode({ id: Number(episodeId) }).then(setEpisode);
  }, [episodeId]);

  useEffect(() => {
    if (tabId === 'chapters' && chapters === undefined) {
      setChapters(null);
      Core.getEpisodeChapters(Number(episodeId)).then(setChapters);
    }
  }, [tabId, chapters]);

  const { selectedId } = useListNav({
    onSelect: (itemId) => {
      if (
        itemId.startsWith('chapter') &&
        chapters &&
        Number(episodeId) === player.episode?.id
      ) {
        const index = parseInt(itemId.split('_')[1], 10);
        console.log('chapter selected', index);
        player.goTo(Math.floor(chapters[index].startTime / 1000));
      }
    },
  });

  function getActionList(): AppBarAction[] {
    if (!episode || episode?.fileType.startsWith('video')) {
      return [];
    }

    const options: AppBarAction[] = [
      {
        id: 'stream',
        label: episode?.isDownloaded ? 'Play' : 'Stream',
        actionFn: () => player.load(episode.id, false),
      },
      {
        id: 'download',
        label: 'Download',
        actionFn: () => addToQueue(episode.id),
      },
      {
        id: 'markPlayed',
        label: 'Mark as Played',
        actionFn: () =>
          Core.updateEpisode(Number(episodeId), {
            playbackStatus: PlaybackStatus.Played,
            progress: episode.duration,
          }),
      },
      {
        id: 'markUnplayed',
        label: 'Mark as Unplayed',
        actionFn: () =>
          Core.updateEpisode(Number(episodeId), {
            playbackStatus: PlaybackStatus.Unplayed,
            progress: 0,
          }),
      },
    ];

    if (episode && episode.progress > 0) {
      options.unshift({
        id: 'resume',
        label: `Resume at ${formatTime(episode.progress)}`,
        actionFn: () => player.load(Number(episodeId), true),
      });
    }

    return options;
  }

  return (
    <View
      backgroundImageUrl={artwork?.image}
      accentColor={episode?.accentColor}
      enableCustomColor={true}
    >
      <ViewTabBar
        tabs={[
          { id: 'info', label: 'info' },
          { id: 'chapters', label: 'chapters' },
        ]}
        selectedId={tabId}
        onChange={(tabId) => route(`/episode/${episodeId}/${tabId}`, true)}
      />
      <ViewTab tabId="info" activeTabId={tabId}>
        {episode?.fileType.startsWith('video') && (
          <div className={styles.accent}>
            Sorry, Foxcasts does not support video podcasts yet.
          </div>
        )}
        <Typography type="subtitle">{episode?.title}</Typography>
        {episode ? (
          <Fragment>
            <LabeledRow
              label="Published"
              text={
                episode
                  ? format(new Date(episode.date), 'ccc, MMMM do p')
                  : null
              }
            />
            <LabeledRow
              label="Progress"
              text={`${formatTime(episode.progress)} of ${
                formatTime(episode.duration) || 'Unknown'
              }`}
            />
            <LabeledRow
              label="File Size"
              text={
                episode.fileSize ? formatFileSize(episode?.fileSize) : 'Unknown'
              }
            />
            <LabeledRow
              label="Downloaded"
              text={episode.localFileUrl || 'No'}
            />
          </Fragment>
        ) : null}

        <Typography>{episode?.description}</Typography>
      </ViewTab>
      <ViewTab tabId="chapters" activeTabId={tabId}>
        {!chapters && <Typography>Loading...</Typography>}
        {chapters?.length === 0 && <Typography>No chapters</Typography>}
        {chapters?.map((chapter, i) => {
          let text = formatTime(chapter.startTime / 1000);
          if (chapter.endTime) {
            text = `${text} - ${formatTime(chapter.endTime / 1000)}`;
          }
          return (
            <ListItem
              key={chapter.startTime}
              primaryText={chapter.title}
              accentText={text}
              selectable={{
                id: `chapter_${i}`,
                selected: selectedId === `chapter_${i}`,
              }}
            />
          );
        })}
      </ViewTab>
      <AppBar actions={getActionList()} />
    </View>
  );
}
