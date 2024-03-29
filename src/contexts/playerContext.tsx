import { EpisodeExtended } from 'foxcasts-core/lib/types';
import { useToast } from 'mai-ui/dist/contexts';
import { createContext, h, VNode } from 'preact';
import { route } from 'preact-router';
import { useContext, useEffect, useState } from 'preact/hooks';
import {
  ComponentBaseProps,
  NotificationAction,
  NotificationType,
} from '../models';
import { Core } from '../services/core';
import { KaiOS } from '../services/kaios';
import { useSettings } from './SettingsProvider';

export type PlaybackProgress = {
  playing: boolean;
  currentTime: number;
  duration: number;
};

type PlayerContextValue = {
  episode?: EpisodeExtended;
  playlistId?: number;
  load: (
    episodeId: number,
    resume?: boolean,
    playlistId?: number
  ) => Promise<PlaybackProgress>;
  play: () => PlaybackProgress;
  pause: () => PlaybackProgress;
  stop: () => void;
  jump: (seconds: number) => PlaybackProgress;
  goTo: (seconds: number) => PlaybackProgress;
  getStatus: () => PlaybackProgress;
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
  const [playlistId, setPlaylistId] = useState<number>();
  const [playing, setPlaying] = useState(false);
  const [audioRef] = useState<HTMLAudioElement>(new Audio());
  const [notification, setNotification] = useState<Notification | null>(null);

  const { showToast } = useToast();
  const { settings } = useSettings();

  async function getNextEpisode(episodeId: number, playlistId?: number) {
    const playlist = playlistId
      ? await Core.playlists.query({ id: playlistId })
      : undefined;
    const nextEpisodeId =
      playlist?.episodeIds[
        (playlist?.episodeIds.findIndex((a) => a === episodeId) || -2) + 1
      ];

    if (nextEpisodeId) {
      load(nextEpisodeId, false, playlistId);
    } else {
      stop();
    }

    if (playlist?.removeEpisodeAfterListening) {
      Core.playlists.update(playlist.id, {
        episodeIds: playlist.episodeIds.filter((a) => a !== episodeId),
      });
    }
  }

  useEffect(() => {
    function handler() {
      if (episode) {
        getNextEpisode(episode.id, playlistId);
      }
    }
    audioRef.addEventListener('ended', handler);

    return () => audioRef.removeEventListener('ended', handler);
  }, [episode, playlistId]);

  useEffect(() => {
    audioRef.playbackRate = settings.playbackSpeed;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.playbackSpeed]);

  function getStatus(): PlaybackProgress {
    return {
      playing: !audioRef.paused,
      currentTime: Math.ceil(audioRef.currentTime),
      duration: Math.ceil(audioRef.duration),
    };
  }

  async function load(
    episodeId: number,
    resume = false,
    playlistId?: number
  ): Promise<PlaybackProgress> {
    setPlaylistId(playlistId);
    const data = await Core.episodes.query({ id: episodeId });

    if (!data) return defaultStatus;

    (audioRef as any).mozAudioChannelType = 'content';
    if (data.isDownloaded && data.localFileUrl) {
      await KaiOS.storage
        .getAsFileUrl('sdcard', data.localFileUrl)
        .then((url) => (audioRef.src = url))
        .catch(() => {
          showToast('File missing! Streaming instead.');
          audioRef.src = data.remoteFileUrl;
        });
    } else {
      audioRef.src = data.remoteFileUrl;
    }
    audioRef.currentTime = resume ? data.progress : 0;
    audioRef.play();

    if (settings.notificationType === NotificationType.EpisodeInfo) {
      setNotification(
        new Notification(data.podcastTitle, {
          tag: 'playback',
          body: data.title,
          icon: data.artwork,
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

  function play(): PlaybackProgress {
    audioRef.play();
    setPlaying(true);
    return getStatus();
  }

  function pause(): PlaybackProgress {
    audioRef.pause();
    setPlaying(false);
    return getStatus();
  }

  function stop(): void {
    setPlaylistId(undefined);
    setEpisode(undefined);
    audioRef.src = '';
    audioRef.currentTime = 0;
    setPlaying(false);
    notification?.close();
  }

  function jump(seconds: number): PlaybackProgress {
    const newTime = audioRef.currentTime + seconds;
    audioRef.currentTime = newTime;
    return getStatus();
  }

  function goTo(seconds: number): PlaybackProgress {
    audioRef.currentTime = seconds;
    return getStatus();
  }

  useEffect(() => {
    const onClick = (): void => {
      if (settings.notificationAction === NotificationAction.ViewPlayer) {
        KaiOS.app.getSelf().then((app) => {
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
        playlistId,
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
