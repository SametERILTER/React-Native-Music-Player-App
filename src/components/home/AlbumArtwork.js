import React from 'react';
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
  borderRadius = radius.md,
  borderWidth = 0,
  borderColor = 'transparent',
}) => {
  const w = width || size;
  const h = height || size;
  const coverSource = getTrackCoverSource(coverId) || (artwork ? (typeof artwork === 'string' ? { uri: artwork } : artwork) : null);

  if (coverSource) {
    return (
      <View style={[styles.artworkContainer, { width: w, height: h, borderRadius, borderWidth, borderColor }]}>
        <Image
          source={coverSource}
          style={styles.coverImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  const iconBase = Math.min(w, h);
  const iconSize = iconBase * 0.44;
  const variant = Math.abs(index) % 4;

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
    backgroundColor: '#fafafaff',
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
