import { format, startOfWeek, sub } from 'date-fns';
import { EpisodeExtended } from 'foxcasts-core/lib/types';
import { h, VNode } from 'preact';
import { route } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';
import { useListNav } from '../hooks/useListNav';
import { Core } from '../services/core';
import { AppBar } from '../ui-components/appbar';
import { ListItem } from '../ui-components/list';
import { Typography } from '../ui-components/Typography';
import {
  View,
  ViewContent,
  ViewHeader,
  ViewTabBar,
} from '../ui-components/view';

interface Props {
  tabId: 'week0' | 'week1' | 'week2' | 'week3' | 'week4';
  selectedItemId?: string;
}

const dates = {
  week0: {
    from: startOfWeek(new Date()),
    to: new Date(),
  },
  week1: {
    from: sub(startOfWeek(new Date()), { weeks: 1 }),
    to: startOfWeek(new Date()),
  },
  week2: {
    from: sub(startOfWeek(new Date()), { weeks: 2 }),
    to: sub(startOfWeek(new Date()), { weeks: 1 }),
  },
  week3: {
    from: sub(startOfWeek(new Date()), { weeks: 3 }),
    to: sub(startOfWeek(new Date()), { weeks: 2 }),
  },
  week4: {
    from: sub(startOfWeek(new Date()), { weeks: 4 }),
    to: sub(startOfWeek(new Date()), { weeks: 3 }),
  },
};

export default function RecentEpisodes({
  tabId,
  selectedItemId,
}: Props): VNode {
  const [episodes, setEpisodes] = useState<EpisodeExtended[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setEpisodes([]);
    setLoading(true);

    Core.episodes
      .queryAll({
        afterDate: dates[tabId].from.toISOString(),
        beforeDate: dates[tabId].to.toISOString(),
      })
      .then((res) => {
        setEpisodes(res);
        setLoading(false);
      });
  }, [tabId]);

  useListNav({
    initialSelectedId: episodes.length > 0 ? selectedItemId : undefined,
    onSelect: (itemId) => itemId && route(`/episode/${itemId}/info`),
  });

  return (
    <View>
      <ViewHeader>Recent Episodes</ViewHeader>
      <ViewTabBar
        tabs={[
          { id: 'week0', label: 'this week' },
          {
            id: 'week1',
            label: 'last week',
          },
          { id: 'week2', label: `week ${format(dates.week2.from, 'w')}` },
          { id: 'week3', label: `week ${format(dates.week3.from, 'w')}` },
          { id: 'week4', label: `week ${format(dates.week4.from, 'w')}` },
        ]}
        selectedId={tabId}
        onChange={(tabId): boolean => route(`/filters/recent/${tabId}`, true)}
      />
      <ViewContent>
        {loading && <Typography>Loading...</Typography>}
        {!loading && episodes.length === 0 && (
          <Typography>No episodes.</Typography>
        )}
        {episodes.map((episode, i) => (
          <ListItem
            key={episode.id}
            imageUrl={episode.artwork}
            primaryText={episode.title}
            secondaryText={format(new Date(episode.date), 'ccc, MMMM do')}
            selectable={{
              id: episode.id,
              shortcut: i + 1 <= 9 ? i + 1 : undefined,
              selected: episode.id.toString() === selectedItemId,
            }}
          />
        ))}
      </ViewContent>
      <AppBar />
    </View>
  );
}
