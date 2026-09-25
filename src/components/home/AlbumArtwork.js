import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Disc3, Music2, Radio, AudioWaveform } from 'lucide-react-native';
import { colors, radius } from '../../theme';

export const AlbumArtwork = ({ size = 52, index = 0 }) => {
  const iconVariants = [
    <Disc3 size={size * 0.44} color={colors.textPrimary} strokeWidth={1.5} />,
    <AudioWaveform size={size * 0.44} color={colors.textPrimary} strokeWidth={1.5} />,
    <Radio size={size * 0.44} color={colors.textPrimary} strokeWidth={1.5} />,
    <Music2 size={size * 0.44} color={colors.textPrimary} strokeWidth={1.5} />,
  ];

  const currentIcon = iconVariants[index % iconVariants.length];

  return (
    <View style={[styles.artworkContainer, { width: size, height: size }]}>
      <View style={styles.innerPattern}>
        <View style={styles.centerDot} />
        {currentIcon}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  artworkContainer: {
    backgroundColor: '#F0F1F3',
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  innerPattern: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F8',
  },
  centerDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textTertiary,
  }
});

export default AlbumArtwork;
