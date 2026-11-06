import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

// Uygulama açılışında intro animasyonunun yalnızca bir kez oynaması için.
let introPlayed = false;

const TYPE_MS = 70;
const DELETE_MS = 45;
const HOLD_MS = 1400;
const START_DELAY_MS = 300;

/**
 * İlk açılışta `introText` gösterilir, klavyeden siliniyormuş gibi silinir
 * ve yerine `finalText` yazılır. Sonraki gösterimlerde doğrudan `finalText` görünür.
 */
export const TypewriterTitle = ({ introText, finalText, style }) => {
  // null => animasyon yok, doğrudan finalText gösterilir
  const [override, setOverride] = useState(introPlayed ? null : introText);

  useEffect(() => {
    if (introPlayed) return undefined;

    let timer;
    let cancelled = false;
    const later = (fn, ms) => {
      timer = setTimeout(() => !cancelled && fn(), ms);
    };

    const typeFinal = (i) => {
      setOverride(finalText.slice(0, i));
      if (i < finalText.length) {
        later(() => typeFinal(i + 1), TYPE_MS);
      } else {
        later(() => {
          introPlayed = true;
          setOverride(null);
        }, 600);
      }
    };

    const erase = (i) => {
      setOverride(introText.slice(0, i));
      if (i > 0) {
        later(() => erase(i - 1), DELETE_MS);
      } else {
        later(() => typeFinal(1), 250);
      }
    };

    later(() => erase(introText.length - 1), START_DELAY_MS + HOLD_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [introText, finalText]);

  const animating = override !== null;

  return (
    <Text style={style} numberOfLines={1}>
      {animating ? override : finalText}
      {animating ? '|' : ''}
    </Text>
  );
};

export default TypewriterTitle;
