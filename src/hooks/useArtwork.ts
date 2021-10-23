import { Artwork } from 'foxcasts-core/lib/types';
import { useEffect, useState } from 'preact/hooks';
import { ArtworkBlur } from '../enums/artworkBlur';
import { ArtworkSize } from '../enums/artworkSize';
import { Core } from '../services/core';

type Options = {
  size: ArtworkSize;
  blur?: ArtworkBlur;
  greyscale?: boolean;
};

type Return = {
  artwork: Artwork | undefined;
  loading: boolean;
  error: boolean;
};

export function useArtwork(
  podcastId: number | string | null,
  { size, blur, greyscale }: Options
): Return {
  const [artwork, setArtwork] = useState<Artwork>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!podcastId) {
      setLoading(false);
      setError(false);
      setArtwork(undefined);
      return;
    }

    setLoading(true);
    setError(false);

    Core.getArtwork(podcastId, { size, blur, greyscale })
      .then((res) => {
        setArtwork(res);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [podcastId, size, blur, greyscale]);

  return { artwork, loading, error };
}
