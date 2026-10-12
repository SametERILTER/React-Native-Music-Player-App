import { useState, useEffect, useMemo } from 'react';
import {
  getSynchronousTrackColors,
  resolveTrackColors,
} from '../services/colorService';

export const useTrackColors = (track, defaultBg = '#F3F3F4') => {
  const [extractedData, setExtractedData] = useState(null);
  const trackKey = track ? `${track.id || ''}_${track.coverId || ''}_${track.coverArt || ''}` : null;

  useEffect(() => {
    let isCancelled = false;
    if (!track) return;

    resolveTrackColors(track, defaultBg)
      .then((resolved) => {
        if (!isCancelled && resolved) {
          setExtractedData({
            key: trackKey,
            colors: resolved,
          });
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [track, defaultBg, trackKey]);

  const activeColors = useMemo(() => {
    if (extractedData && extractedData.key === trackKey && extractedData.colors) {
      console.log('[useTrackColors] Using EXTRACTED colors for:', track?.title, extractedData.colors.primary);
      return extractedData.colors;
    }
    const sync = getSynchronousTrackColors(track, defaultBg);
    console.log('[useTrackColors] Using SYNC/FALLBACK colors for:', track?.title, sync.primary);
    return sync;
  }, [extractedData, trackKey, track, defaultBg]);

  return activeColors;
};

export default useTrackColors;
