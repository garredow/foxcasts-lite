import { formatFileSize } from 'foxcasts-core/lib/utils';
import { Fragment, h, VNode } from 'preact';
import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import ProgressBar from '../components/ProgressBar';
import { useDownloadManager } from '../contexts/DownloadManagerProvider';
import { useListNav } from '../hooks/useListNav';
import { Download, DownloadStatus } from '../models';
import { AppBar, AppBarAction } from '../ui-components/appbar';
import { ListItem } from '../ui-components/list';
import { Typography } from '../ui-components/Typography';
import { View, ViewContent, ViewHeader } from '../ui-components/view';
import styles from './Downloads.module.css';

interface Props {
  selectedItemId?: string;
}

type Downloads = {
  queued: Download[];
  downloading: Download[];
  failed: Download[];
  completed: Download[];
};

export default function Downloads({ selectedItemId }: Props): VNode {
  const [downloads, setDownloads] = useState<Downloads>({
    queued: [],
    downloading: [],
    failed: [],
    completed: [],
  });
  const { queue, addToQueue, removeFromQueue } = useDownloadManager();

  useEffect(() => {
    const newDownloads: Downloads = {
      queued: [],
      downloading: [],
      failed: [],
      completed: [],
    };
    queue.forEach((item) => {
      if (item.status === DownloadStatus.Queued) {
        newDownloads.queued.push(item);
      } else if (item.status === DownloadStatus.Downloading) {
        newDownloads.downloading.push(item);
      } else if (item.status === DownloadStatus.Error) {
        newDownloads.failed.push(item);
      } else {
        newDownloads.completed.unshift(item);
      }
    });

    setDownloads(newDownloads);
  }, [queue]);

  function getSelectedItem(): Download | undefined {
    if (!selectedItemId) return;
    return queue.find((a) => a.episodeId === parseInt(selectedItemId, 10));
  }

  function viewEpisode(episodeId: string | number): void {
    route(`/episode/${episodeId}/info`);
  }

  const { selectedId } = useListNav({
    onSelect: (itemId) => viewEpisode(itemId),
    // onChange: (itemId) => {
    //   if (itemId) {
    //     route(`/downloads/?selectedItemId=${itemId}`, true);
    //   } else {
    //     route(`/downloads/`, true);
    //   }
    // },
  });

  async function runTest(): Promise<void> {
    await addToQueue(1);
    await addToQueue(2);
    await addToQueue(3);
    await addToQueue(4);
    await addToQueue(5);
  }

  function getStatusMessage(item: Download): string {
    if (item.currentBytes === 0 && item.totalBytes === 0) {
      return 'In queue';
    }

    const bytes = (item.currentBytes / item.totalBytes) * 100 || 0;
    if (bytes < 100) {
      return `${formatFileSize(item.currentBytes)}/${formatFileSize(
        item.totalBytes
      )}`;
    }

    return 'Complete';
  }

  function getActions(): AppBarAction[] {
    const actions: AppBarAction[] = [
      { id: 'test', label: 'Test', actionFn: () => runTest() },
    ];

    const item = getSelectedItem();
    if (!item) return actions;

    if (
      item.status === DownloadStatus.Queued ||
      item.status === DownloadStatus.Downloading
    ) {
      actions.push({
        id: 'remove',
        label: 'Cancel download',
        actionFn: () => {
          item && removeFromQueue(item.episodeId);
          route(`/downloads/`, true);
        },
      });
    } else if (
      item.status === DownloadStatus.Cancelled ||
      item.status === DownloadStatus.Error
    ) {
      actions.push({
        id: 'retry',
        label: 'Retry download',
        actionFn: () => item && addToQueue(item.episodeId),
      });
    } else {
      actions.push({
        id: 'remove',
        label: 'Remove from list',
        actionFn: () => {
          item && removeFromQueue(item.episodeId);
          route(`/downloads/`, true);
        },
      });
    }

    return actions;
  }

  return (
    <View>
      <ViewHeader>Downloads</ViewHeader>
      <ViewContent>
        {downloads.downloading.map((item) => (
          <div key={item.episodeId}>
            <ListItem
              primaryText={item.episodeTitle}
              secondaryText={item.podcastTitle}
              selectable={{
                id: item.episodeId,
                selected: selectedId === item.episodeId.toString(),
              }}
            />
            <div className={styles.progressContainer}>
              <ProgressBar
                position={(item.currentBytes / item.totalBytes) * 100 || 0}
                className={styles.progressBar}
              />
              <div className={styles.progress}>
                <Typography type="caption">{getStatusMessage(item)}</Typography>
              </div>
            </div>
          </div>
        ))}
        <Typography type="caption" color="accent" padding="both">
          Queue
        </Typography>
        {downloads.queued.map((download) => (
          <ListItem
            key={download.episodeId}
            primaryText={download.episodeTitle}
            secondaryText={download.podcastTitle}
            selectable={{
              id: download.episodeId,
              selected: selectedId === download.episodeId.toString(),
            }}
          />
        ))}
        {downloads.queued.length === 0 && (
          <Typography padding="both">Nothing in the queue</Typography>
        )}
        {downloads.failed.length > 0 ? (
          <Fragment>
            <Typography type="caption" color="accent" padding="both">
              Failed
            </Typography>
            {downloads.failed.map((download) => (
              <ListItem
                key={download.episodeId}
                primaryText={download.episodeTitle}
                secondaryText={download.podcastTitle}
                selectable={{
                  id: download.episodeId,
                  selected: selectedId === download.episodeId.toString(),
                }}
              />
            ))}
          </Fragment>
        ) : null}
        <Typography type="caption" color="accent" padding="both">
          Completed
        </Typography>
        {downloads.completed.map((download) => (
          <ListItem
            key={download.episodeId}
            primaryText={download.episodeTitle}
            secondaryText={download.podcastTitle}
            selectable={{
              id: download.episodeId,
              selected: selectedId === download.episodeId.toString(),
            }}
          />
        ))}
        {downloads.completed.length === 0 && (
          <Typography padding="both">No recent downloads</Typography>
        )}
      </ViewContent>
      <AppBar actions={getActions()} />
    </View>
  );
}
