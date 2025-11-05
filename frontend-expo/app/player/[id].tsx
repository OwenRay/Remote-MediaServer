import React, {useEffect, useState} from 'react';
import {useLocalSearchParams, useNavigation, useRouter} from 'expo-router';
import {usePlayerController} from '@/src/features/player/domain/usePlayerController';
import {PlayerScreenView} from '@/src/features/player/view/PlayerScreenView';
import {useGoogleCast} from "@/src/features/player/domain/useGoogleCast";
import { usePlayQueue } from '@/src/features/playqueue/domain/usePlayQueue';

export default function PlayerScreen() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { state: queue } = usePlayQueue();

  let controller = usePlayerController({id});
  const castingController = useGoogleCast(controller);
  if(castingController.isCasting) {
    controller = castingController;
  }

  const [controlsVisible, setControlsVisible] = useState(true);

  useEffect(() => {
    navigation.setOptions?.({
      title: [
        controller.item?.seasonEpisodeTag,
        controller.item?.title
      ].join(' • ') || 'Details',
      headerTransparent: true,
      headerShown: controlsVisible,
    });
  }, [controller.item, controller.item?.title, controller.item?.season, controller.item?.episode, controlsVisible, navigation]);

  // When the play queue changes currently playing item, update the route so the player loads the next/prev media.
  useEffect(() => {
    const nextId = queue.playing?.id ? String(queue.playing.id) : undefined;
    const curId = id ? String(id) : undefined;
    if (nextId && curId && nextId !== curId) {
      try { router.replace(`/player/${nextId}`); } catch { router.push(`/player/${nextId}`); }
    }
  }, [queue.playing?.id, id, router]);

  return (
    <PlayerScreenView
      controller={controller}
      castingController={castingController}
      onControlsVisibilityChange={setControlsVisible}
    />
  );
}
