import React, {useEffect, useState} from 'react';
import {useLocalSearchParams, useNavigation} from 'expo-router';
import {usePlayerController} from '@/src/features/player/domain/usePlayerController';
import {PlayerScreenView} from '@/src/features/player/view/PlayerScreenView';
import {useGoogleCast} from "@/src/features/player/domain/useGoogleCast";

export default function PlayerScreen() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  let controller = usePlayerController({id});
  const castingController = useGoogleCast(controller);
  if(castingController.isCasting) {
    controller = castingController;
  }

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
      castingController={castingController}
      onControlsVisibilityChange={setControlsVisible}
    />
  );
}
