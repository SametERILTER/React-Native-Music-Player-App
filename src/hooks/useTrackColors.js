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
      return extractedData.colors;
    }
    return getSynchronousTrackColors(track, defaultBg);
  }, [extractedData, trackKey, track, defaultBg]);

  return activeColors;
};

export default useTrackColors;
