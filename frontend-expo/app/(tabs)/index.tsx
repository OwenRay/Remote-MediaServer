import React from 'react';
import { ScrollView } from 'react-native';
import { default as styled } from 'styled-components/native';

import { ItemsRow } from '@/src/features/home/view/ItemsRow';

export default function HomeScreen() {
  return (
    <ScreenContainer>
      <ScrollView>
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

const ContentPad = styled.View`
  padding: 16px;
  gap: 16px;
`;
