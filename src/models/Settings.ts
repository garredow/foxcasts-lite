import { Palette } from 'foxcasts-core/lib/types';

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export enum ListLayout {
  List = 'list',
  Grid = 'grid',
}

export enum TextSize {
  Smallest = 'smallest',
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Largest = 'largest',
}

export enum AppBarSize {
  Hidden = 'hidden',
  Compact = 'compact',
  Normal = 'normal',
}

export enum NotificationType {
  None = 'none',
  EpisodeInfo = 'episodeInfo',
}

export enum NotificationAction {
  ViewPlayer = 'viewPlayer',
  PlayPause = 'playpause',
}

export type PodcastSettings = {
  accentColor: keyof Palette;
};

export enum PlayerLayout {
  Fancy = 'fancy',
  Simple = 'simple',
}

export type Settings = {
  theme: Theme;
  accentColor: string;
  appBarAccent: boolean;
  dynamicThemeColor: boolean;
  dynamicBackgrounds: boolean;

  podcastsLayout: ListLayout;
  homeMenuLayout: ListLayout;
  textSize: TextSize;
  appBarSize: AppBarSize;

  playerLayout: PlayerLayout;
  notificationType: NotificationType;
  notificationAction: NotificationAction;
  playbackSpeed: number;
  playbackSkipBack: number;
  playbackSkipForward: number;
  autoDeleteDownload: boolean;

  podcastSettings: { [key: number]: PodcastSettings };
};
