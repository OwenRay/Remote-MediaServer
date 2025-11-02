import React from 'react';
import { Animated } from 'react-native';
import { default as styled } from 'styled-components/native';

import { ItemsRow } from '@/src/features/home/view/ItemsRow';
import { Logo } from '@/src/features/shared/view/Logo';

export default function HomeScreen() {
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const LOGO_SIZE = 128;
  const HERO_VERTICAL_PAD = 80; // top+bottom padding around the logo
  const HERO_HEIGHT = LOGO_SIZE + HERO_VERTICAL_PAD; // space reserved at top of content

  const logoTranslateY = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT * 2],
    outputRange: [0, -HERO_HEIGHT * 0.6], // move up slower than scroll
    extrapolate: 'clamp',
  });

  const logoOpacity = scrollY.interpolate({
    inputRange: [0, HERO_HEIGHT],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  return (
    <ScreenContainer>
      {/* Parallax logo layer behind content */}
      <AbsoluteLogo style={{ transform: [{ translateY: logoTranslateY }], opacity: logoOpacity }} pointerEvents="none">
        <Logo size={LOGO_SIZE} />
      </AbsoluteLogo>

      {/* Foreground scrollable content overlays the logo */}
      <Animated.ScrollView
        nestedScrollEnabled
        contentContainerStyle={{ paddingTop: HERO_HEIGHT }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <ContentPad>
          <ItemsRow title="Continue watching" row="continueWatching" />
          <ItemsRow title="Recommended Movies" row="recommended" />
          <ItemsRow title="New Movies" row="newMovies" />
          <ItemsRow title="New Episodes" row="newTV" />
        </ContentPad>
      </Animated.ScrollView>
    </ScreenContainer>
  );
}

const ScreenContainer = styled.View`
  flex: 1;
`;

const AbsoluteLogo = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 0;
  align-items: center;
  padding: 45px;
`;

const ContentPad = styled.View`
  padding: 8px;
`;
