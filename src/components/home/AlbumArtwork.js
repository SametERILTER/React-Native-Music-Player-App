import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Disc3, Music2, Radio, AudioWaveform } from 'lucide-react-native';
import { colors, radius } from '../../theme';
import { getTrackCoverSource } from '../../constants/playlistCovers';

export const AlbumArtwork = React.memo(({
  size = 52,
  width,
  height,
  index = 0,
  coverId = null,
  artwork = null,
  track = null,
  borderRadius = radius.md,
  borderWidth = 0,
  borderColor = 'transparent',
}) => {
  const w = width || size;
  const h = height || size;

  const finalCoverId = coverId ?? track?.coverId ?? null;
  const rawArtwork = artwork ?? track?.coverArt ?? track?.artwork ?? null;
  const finalIndex = index || track?.trackNumber || 0;

  const albumId = track?.albumId || null;
  const mediaId = track?.mediaId || (track?.id && String(track.id).startsWith('local-') ? String(track.id).replace('local-', '') : null);

  // If user selected a preset artwork from the app's collection
  const presetCover = finalCoverId ? getTrackCoverSource(finalCoverId) : null;

  // Primary content URI
  const primaryArtworkUri = useMemo(() => {
    if (rawArtwork) return rawArtwork;
    if (albumId) return `content://media/external/audio/albumart/${albumId}`;
    if (mediaId) return `content://media/external/audio/media/${mediaId}/albumart`;
    return null;
  }, [rawArtwork, albumId, mediaId]);

  // Secondary fallback URI if primary fails
  const secondaryArtworkUri = useMemo(() => {
    if (mediaId) {
      const mediaUri = `content://media/external/audio/media/${mediaId}/albumart`;
      if (primaryArtworkUri !== mediaUri) return mediaUri;
    }
    if (albumId) {
      const albumUri = `content://media/external/audio/albumart/${albumId}`;
      if (primaryArtworkUri !== albumUri) return albumUri;
    }
    return null;
  }, [mediaId, albumId, primaryArtworkUri]);

  const [hasError, setHasError] = useState(false);
  const [triedSecondary, setTriedSecondary] = useState(false);

  useEffect(() => {
    setHasError(false);
    setTriedSecondary(false);
  }, [finalCoverId, primaryArtworkUri, track?.id]);

  const activeArtworkUri = triedSecondary ? secondaryArtworkUri : primaryArtworkUri;
  const activeImageSource = useMemo(() => {
    if (presetCover) return presetCover;
    if (!activeArtworkUri || hasError) return null;
    return typeof activeArtworkUri === 'string' ? { uri: activeArtworkUri } : activeArtworkUri;
  }, [presetCover, activeArtworkUri, hasError]);

  const handleImageError = useCallback(() => {
    if (!triedSecondary && secondaryArtworkUri && secondaryArtworkUri !== primaryArtworkUri) {
      setTriedSecondary(true);
    } else {
      setHasError(true);
    }
  }, [triedSecondary, secondaryArtworkUri, primaryArtworkUri]);

  if (activeImageSource && !hasError) {
    return (
      <View style={[styles.artworkContainer, { width: w, height: h, borderRadius, borderWidth, borderColor }]}>
        <Image
          source={activeImageSource}
          style={styles.coverImage}
          resizeMode="cover"
          onError={handleImageError}
        />
      </View>
    );
  }

  const iconBase = Math.min(w, h);
  const iconSize = iconBase * 0.44;
  const variant = Math.abs(finalIndex) % 4;

  const renderIcon = () => {
    switch (variant) {
      case 0:
        return <Disc3 size={iconSize} color={colors.textPrimary} strokeWidth={1.5} />;
      case 1:
        return <AudioWaveform size={iconSize} color={colors.textPrimary} strokeWidth={1.5} />;
      case 2:
        return <Radio size={iconSize} color={colors.textPrimary} strokeWidth={1.5} />;
      case 3:
      default:
        return <Music2 size={iconSize} color={colors.textPrimary} strokeWidth={1.5} />;
    }
  };

  return (
    <View style={[styles.artworkContainer, { width: w, height: h, borderRadius, borderWidth, borderColor }]}>
      <View style={styles.innerPattern}>
        <View style={styles.centerDot} />
        {renderIcon()}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  artworkContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 0,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  innerPattern: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  centerDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
  },
});

AlbumArtwork.displayName = 'AlbumArtwork';

export default AlbumArtwork;
