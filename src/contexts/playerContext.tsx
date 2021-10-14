import { EpisodeExtended } from 'foxcasts-core/lib/types';
import { createContext, h, VNode } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { Core } from '../services/core';
import {
  ComponentBaseProps,
  NotificationAction,
  NotificationType,
} from '../models';
import { getFileAsUrl } from '../services/files';
import { useToast } from './ToastProvider';
import { useEffect } from 'react';
import { useSettings } from './SettingsProvider';
import { route } from 'preact-router';
import { KaiOS } from '../services/kaios';

export type PlaybackStatus = {
  playing: boolean;
  currentTime: number;
  duration: number;
};

type PlayerContextValue = {
  episode?: EpisodeExtended;
  load: (episodeId: number, resume?: boolean) => Promise<PlaybackStatus>;
  play: () => PlaybackStatus;
  pause: () => PlaybackStatus;
  stop: () => void;
  jump: (seconds: number) => PlaybackStatus;
  goTo: (seconds: number) => PlaybackStatus;
  getStatus: () => PlaybackStatus;
  audioRef: HTMLAudioElement;
  playing: boolean;
};

const defaultStatus = {
  playing: false,
  currentTime: 0,
  duration: 0,
};
const defaulValue: PlayerContextValue = {
  load: () => Promise.resolve(defaultStatus),
  play: () => defaultStatus,
  pause: () => defaultStatus,
  stop: () => console.log('stop'),
  jump: () => defaultStatus,
  goTo: () => defaultStatus,
  getStatus: () => defaultStatus,
  audioRef: new Audio(),
  playing: false,
};
export const PlayerContext = createContext<PlayerContextValue>(defaulValue);

export function PlayerProvider(props: ComponentBaseProps): VNode {
  const [episode, setEpisode] = useState<EpisodeExtended>();
  const [playing, setPlaying] = useState(false);
  const [audioRef] = useState<HTMLAudioElement>(new Audio());
  const [notification, setNotification] = useState<Notification | null>(null);

  const { showToast } = useToast();
  const { settings } = useSettings();

  function getStatus(): PlaybackStatus {
    return {
      playing: !audioRef.paused,
      currentTime: Math.ceil(audioRef.currentTime),
      duration: Math.ceil(audioRef.duration),
    };
  }

  async function load(
    episodeId: number,
    resume = false
  ): Promise<PlaybackStatus> {
    const data = await Core.getEpisodeById(episodeId);
    const podcast = await Core.getPodcastById(data.podcastId);

    if (!data) return defaultStatus;

    (audioRef as any).mozAudioChannelType = 'content';
    if (data.isDownloaded && data.localFileUrl) {
      await getFileAsUrl(data.localFileUrl)
        .then((url) => (audioRef.src = url))
        .catch(() => {
          showToast('File missing! Streaming instead.');
          audioRef.src = data.fileUrl;
        });
    } else {
      audioRef.src = data.fileUrl;
    }
    audioRef.currentTime = resume ? data.progress : 0;
    audioRef.play();

    if (settings.notificationType === NotificationType.EpisodeInfo) {
      setNotification(
        new Notification(data.podcastTitle, {
          tag: 'playback',
          body: data.title,
          icon: podcast.artwork,
          silent: true,
          renotify: false,
        })
      );
    } else {
      notification?.close();
      setNotification(null);
    }

    setEpisode(data);
    setPlaying(true);

    return {
      playing: true,
      currentTime: resume ? data.progress : 0,
      duration: data.duration,
    };
  }

  function play(): PlaybackStatus {
    audioRef.play();
    setPlaying(true);
    return getStatus();
  }

  function pause(): PlaybackStatus {
    audioRef.pause();
    setPlaying(false);
    return getStatus();
  }

  function stop(): void {
    setEpisode(undefined);
    audioRef.src = '';
    audioRef.currentTime = 0;
    setPlaying(false);
    notification?.close();
  }

  function jump(seconds: number): PlaybackStatus {
    const newTime = audioRef.currentTime + seconds;
    audioRef.currentTime = newTime;
    return getStatus();
  }

  function goTo(seconds: number): PlaybackStatus {
    audioRef.currentTime = seconds;
    return getStatus();
  }

  useEffect(() => {
    const onClick = (): void => {
      if (settings.notificationAction === NotificationAction.ViewPlayer) {
        KaiOS.getSelfApp().then((app) => {
          app.launch();
          setTimeout(() => {
            route('/player');
          }, 300);
        });
      } else if (
        settings.notificationAction === NotificationAction.PlayPause &&
        playing
      ) {
        audioRef.pause();
        setPlaying(false);
      } else if (
        settings.notificationAction === NotificationAction.PlayPause &&
        !playing
      ) {
        audioRef.play();
        setPlaying(true);
      }
    };

    notification?.addEventListener('click', onClick);

    return (): void => {
      notification?.removeEventListener('click', onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notification, playing, settings.notificationAction]);

  return (
    <PlayerContext.Provider
      value={{
        episode,
        load,
        play,
        pause,
        stop,
        jump,
        goTo,
        getStatus,
        audioRef,
        playing,
      }}
    >
      {props.children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
