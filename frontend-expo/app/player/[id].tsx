import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import {useGetItemQuery} from '@/src/features/library/model/media';
import {usePlayerController} from '@/src/features/player/domain/usePlayerController';
import {PlayerScreenView} from '@/src/features/player/view/PlayerScreenView';

export default function PlayerScreen() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const {data} = useGetItemQuery(id);

  const controller = usePlayerController({id: String(id), duration: data?.fileduration});

  return (
    <PlayerScreenView
      controller={controller}
      duration={data?.fileduration}
      hasData={!!data}
      missingId={!id}
    />
  );
}
