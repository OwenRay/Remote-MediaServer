import React from 'react';
import { ScrollView } from 'react-native';
import { default as styled } from 'styled-components/native';

import { ItemsRow } from '@/src/features/home/view/ItemsRow';
import { Logo } from '@/src/features/shared/view/Logo';

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <ScrollView nestedScrollEnabled>
        <HeaderHero>
          <Logo size={96} />
        </HeaderHero>
        <ContentPad>
          <ItemsRow title="Continue watching" row="continueWatching" />
          <ItemsRow title="Recommended Movies" row="recommended" />
          <ItemsRow title="New Movies" row="newMovies" />
          <ItemsRow title="New Episodes" row="newTV" />
        </ContentPad>
      </ScrollView>
    </ScreenContainer>
  );
}

const ScreenContainer = styled.View`
  flex: 1;
`;

const HeaderHero = styled.View`
  padding: 24px 16px 8px 16px;
  align-items: center;
`;

const ContentPad = styled.View`
  padding: 8px;
`;
