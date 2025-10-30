import React, {useEffect, useState} from 'react';
import {useLocalSearchParams, useNavigation} from 'expo-router';
import {usePlayerController} from '@/src/features/player/domain/usePlayerController';
import {PlayerScreenView} from '@/src/features/player/view/PlayerScreenView';

export default function PlayerScreen() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const controller = usePlayerController({id});
  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    navigation.setOptions?.({
      title: controller.item?.title,
      headerTransparent: true,
      headerShown: controlsVisible,
    });
  }, [controller.item?.title, controlsVisible, navigation]);

  return (
    <PlayerScreenView
      controller={controller}
      onControlsVisibilityChange={setControlsVisible}
    />
  );
}
