import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { House, ListMusic, Search, Heart } from 'lucide-react-native';
import { colors, radius } from '../../theme';

// Tekil Tab Butonu (Mikro büyüme ve yaylanma animasyonu ile)
const TabButton = ({
  route,
  isFocused,
  onPress,
  onTabPressIn,
  onTabPressOut,
  getTabIcon,
}) => {
  const itemScale = useSharedValue(1);

  const itemAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: itemScale.value }],
    };
  });

  const handlePressIn = () => {
    itemScale.value = withSpring(1.08, {
      damping: 12,
      stiffness: 300,
      mass: 0.5,
    });
    onTabPressIn?.();
  };

  const handlePressOut = () => {
    itemScale.value = withSpring(1, {
      damping: 14,
      stiffness: 260,
      mass: 0.6,
    });
    onTabPressOut?.();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      unstable_pressDelay={0}
      style={styles.tabItemPressable}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
    >
      <Animated.View
        style={[
          styles.tabItem,
          isFocused && styles.tabItemActive,
          itemAnimatedStyle,
        ]}
      >
        {getTabIcon(route.name, isFocused)}
      </Animated.View>
    </Pressable>
  );
};

export const FloatingTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomMargin = Math.max(insets.bottom, 16);

  // Tab Bar'ın tamamı için basınca hafif büyüme animasyonu
  const barScale = useSharedValue(1);

  const barAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: barScale.value }],
    };
  });

  const handleBarPressIn = () => {
    barScale.value = withSpring(1.045, {
      damping: 14,
      stiffness: 280,
      mass: 0.6,
    });
  };

  const handleBarPressOut = () => {
    barScale.value = withSpring(1, {
      damping: 14,
      stiffness: 240,
      mass: 0.8,
    });
  };

  const getTabIcon = (routeName, isFocused) => {
    const iconColor = isFocused ? colors.textInverse : colors.tabBarInactive;
    const size = 20;
    const strokeWidth = isFocused ? 2.2 : 1.8;

    switch (routeName) {
      case 'Home':
        return <House size={size} color={iconColor} strokeWidth={strokeWidth} />;
      case 'Library':
        return <ListMusic size={size} color={iconColor} strokeWidth={strokeWidth} />;
      case 'Search':
        return <Search size={size} color={iconColor} strokeWidth={strokeWidth} />;
      case 'Favorites':
        return (
          <Heart
            size={size}
            color={iconColor}
            strokeWidth={strokeWidth}
            fill={isFocused ? colors.textInverse : 'transparent'}
          />
        );
      default:
        return <House size={size} color={iconColor} strokeWidth={strokeWidth} />;
    }
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Alttan Yukarı Doğru Yumuşak Kaybolma Gradienti */}
      <LinearGradient
        colors={[
          'rgba(243, 243, 243, 0)',
          'rgba(243, 243, 243, 0.5)',
          'rgba(243, 243, 243, 0.95)',
          colors.background,
        ]}
        locations={[0, 0.35, 0.75, 1]}
        style={styles.gradientBottom}
        pointerEvents="none"
      />

      {/* Yüzen Tab Bar */}
      <View style={[styles.tabBarInner, { paddingBottom: bottomMargin }]} pointerEvents="box-none">
        <Animated.View style={[styles.container, barAnimatedStyle]}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabButton
                key={route.key}
                route={route}
                index={index}
                isFocused={isFocused}
                onPress={onPress}
                onTabPressIn={handleBarPressIn}
                onTabPressOut={handleBarPressOut}
                getTabIcon={getTabIcon}
              />
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  tabBarInner: {
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: radius.full,
    paddingVertical: 7,
    paddingHorizontal: 6,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
  },
  tabItemPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    width: '100%',
    height: 42,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: colors.tabBarActive,
  },
});

export default FloatingTabBar;
