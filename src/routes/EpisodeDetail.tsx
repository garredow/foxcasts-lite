import { h, VNode } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { MenuOption, View } from '../ui-components';
import styles from './EpisodeDetail.module.css';
import { usePlayer } from '../contexts/playerContext';
import { EpisodeExtended } from 'foxcasts-core/lib/types';
import { formatFileSize, formatTime } from 'foxcasts-core/lib/utils';
import { Core } from '../services/core';

interface EpisodeDetailProps {
  episodeId: string;
}

export default function EpisodeDetail({
  episodeId,
}: EpisodeDetailProps): VNode {
  const [episode, setEpisode] = useState<EpisodeExtended>();

  const player = usePlayer();

  useEffect(() => {
    Core.getEpisodeById(parseInt(episodeId, 10)).then((result) => {
      setEpisode(result);
    });
  }, [episodeId]);

  function getActionList(): MenuOption[] {
    if (episode?.fileType.startsWith('video')) {
      return [];
    }

    const options = [
      { id: 'stream', label: 'Stream' },
      // { id: 'markPlayed', label: 'Mark as Played' },
      // { id: 'markUnplayed', label: 'Mark as Unplayed' }
    ];

    if (episode && episode.progress > 0) {
      options.push({
        id: 'resume',
        label: `Resume at ${formatTime(episode.progress)}`,
      });
    }

    return options;
  }

  function handleAction(action: string): void {
    if (!episode) return;

    switch (action) {
      case 'stream':
        player.load(episode.id, false);
        break;
      case 'resume':
        player.load(episode.id, true);
        break;
    }
  }

  return (
    <View
      headerText={episode?.podcastTitle}
      actions={getActionList()}
      onAction={handleAction}
    >
      <div className={styles.details}>
        {episode?.fileType.startsWith('video') && (
          <div className={styles.accent}>
            Sorry, Foxcasts does not support video podcasts yet.
          </div>
        )}
        <div className={styles.title}>{episode?.title}</div>
        <div className={styles.date}>
          {episode ? new Date(episode.date).toLocaleDateString() : null}
        </div>
        <div>
          Duration:{' '}
          <span className={styles.accent}>
            {episode?.duration ? formatTime(episode?.duration) : 'Unknown'}
          </span>
        </div>
        <div>
          File Size:{' '}
          <span className={styles.accent}>
            {episode?.fileSize ? formatFileSize(episode?.fileSize) : 'Unknown'}
          </span>
        </div>
        <p>{episode?.description}</p>
      </div>
    </View>
  );
}
