import React from 'react';
import { ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useGetItemQuery } from '@/src/services/api/media';
import { ThemedText } from '@/src/components/themed-text';
import { useTheme } from '@react-navigation/native';
import styled from 'styled-components/native';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: item, isLoading, isError } = useGetItemQuery(String(id));
  const router = useRouter();
  const theme = useTheme();

  if (isLoading) {
    return (
      <Center>
        <ActivityIndicator size="large" color={theme.colors.text} />
      </Center>
    );
  }

  if (isError || !item) {
    return (
      <Center>
        <ThemedText>Failed to load item.</ThemedText>
      </Center>
    );
  }

  return (
    <Container>
      <Title type="title">{item.title}</Title>
      <Meta>Duration: {Math.round((item.fileduration ?? 0) / 60)} min</Meta>
      <Actions>
        <PlayBtn accessibilityLabel="Play" onPress={() => router.push(`/player/${item.id}`)}>
          <PlayText>Play</PlayText>
        </PlayBtn>
      </Actions>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  gap: 12px;
  padding: 16px;
`;

const Center = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Title = styled(ThemedText)`
  font-weight: 700;
  font-size: 20px;
`;

const Meta = styled(ThemedText)`
  opacity: 0.8;
`;

const Actions = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-top: 8px;
`;

const PlayBtn = styled.Pressable`
  background-color: #00b894;
  padding-horizontal: 16px;
  padding-vertical: 10px;
  border-radius: 8px;
`;

const PlayText = styled(ThemedText)`
  color: white;
  font-weight: 700;
`;
