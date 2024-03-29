import { AppBar } from 'mai-ui/dist/components/appbar';
import { Button } from 'mai-ui/dist/components/buttons';
import { SelectableBase } from 'mai-ui/dist/components/SelectableBase';
import { Typography } from 'mai-ui/dist/components/Typography';
import { View, ViewContent } from 'mai-ui/dist/components/view';
import { useListNav } from 'mai-ui/dist/hooks';
import { h, VNode } from 'preact';
import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { FoxcastsAppMenu } from '../components/FoxcastsAppMenu';
import Statusbar from '../components/Statusbar';
import { SelectablePriority } from '../enums';
import { subscribe } from '../services/core';
import { OPML } from '../services/opml';
import styles from './Import.module.css';

type Feed = {
  id: number;
  selected: boolean;
  title: string;
  feedUrl: string;
};

interface Props {
  filePath: string;
}

export default function Import(props: Props): VNode {
  const [feeds, setFeeds] = useState<Feed[]>();
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    OPML.openFile(props.filePath).then(({ data }) => {
      setFeeds(
        data.feeds.map((feed, i) => ({
          id: i,
          selected: true,
          title: feed.text,
          feedUrl: feed.xmlUrl,
        }))
      );
    });
  }, [props.filePath]);

  async function subscribeToPodcasts(): Promise<void> {
    if (subscribing || !feeds) return;

    setSubscribing(true);
    for (const podcast of feeds.filter((a) => a.selected)) {
      console.log(`Subscribing to ${podcast.title}`);
      await subscribe({ feedUrl: podcast.feedUrl })
        .then(() => console.log(`Subscribed to ${podcast.title}`))
        .catch((err) => console.log(`Failed to subscribe to ${podcast.title}`, err));
    }
    setSubscribing(false);
    route('/podcasts');
  }

  const { selectedId } = useListNav({
    onSelect: (itemId) => {
      if (itemId === 'btnImport') {
        subscribeToPodcasts();
        return;
      }

      if (feeds) {
        setFeeds(
          feeds.map((podcast) => {
            if (podcast.id === parseInt(itemId, 10)) {
              podcast.selected = !podcast.selected;
            }
            return podcast;
          })
        );
      }
    },
  });

  return (
    <View>
      <Statusbar text="Import OPML" />
      <ViewContent>
        <div className={styles.message}>
          Choose which podcasts you want, then click the{' '}
          <span className={styles.accent}>Import</span> button below.
        </div>
        {feeds === undefined && <Typography align="center">Loading...</Typography>}
        {feeds?.length === 0 && <Typography align="center">No feeds found.</Typography>}
        {feeds?.map((podcast) => (
          <SelectableBase
            key={podcast.id}
            id={podcast.id}
            selected={selectedId === podcast.id.toString()}
            className={styles.row}
          >
            {podcast.title}
            <input type="checkbox" checked={podcast.selected} />
          </SelectableBase>
        ))}
        <div className={styles.actions}>
          <Button
            text={subscribing ? 'Importing...' : 'Import'}
            selectable={{
              priority: SelectablePriority.Low,
              id: 'btnImport',
              selected: selectedId === 'btnImport',
            }}
            disabled={subscribing || feeds?.every((a) => !a.selected)}
          />
        </div>
      </ViewContent>
      <AppBar appMenuContent={<FoxcastsAppMenu />} />
    </View>
  );
}
