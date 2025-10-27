import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Platform} from 'react-native';
import {ThemedText} from '@/src/components/themed-text';
import {useLocalSearchParams} from 'expo-router';
import {useVideoPlayer, VideoView} from 'expo-video';
import {getBaseUrl} from '@/src/services/api/base';
import {useWritePlayPositionMutation} from '@/src/services/api/playback';
import {SeekBar} from '@/src/components/SeekBar';
import {useGetItemQuery} from '@/src/services/api/media';
import {default as styled} from 'styled-components/native';

export default function PlayerScreen() {
  const {id} = useLocalSearchParams<{ id: string }>();
  const {data} = useGetItemQuery(id);

  const [paused, setPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string>();

  const [writePos] = useWritePlayPositionMutation();

  const [, setReRender] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setReRender(Math.random());
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  const source = useMemo(() => {
    const seek = Math.floor(position);
    return {uri: `${getBaseUrl()}/ply/${id}/${seek}`};
  }, [id, position]);

  const player = useVideoPlayer(source, (v) => {
    console.log("video player created");
  })

  useEffect(() => {
    if(!data) return;
    player.play();
    setPaused(false);
    return () => {
      if (id && data.fileduration > 0) {
        writePos({mediaItemId: String(id), position, duration:data.fileduration}).catch(() => {
        });
      }
    };
  }, [data, id, player, position, writePos]);

  const togglePlay = useCallback(async () => {
    console.log('togglePlay');
    setPaused(!paused);
    if (player.playing) player.pause();
    else player.play();
  }, [paused, player]);

  const onSeek = useCallback(async (val: number) => {
    console.log('onSeek', val);
    setPosition(val);
    setPaused(false);
  }, []);

  const retry = useCallback(() => {
    setError(undefined);
    console.log('retry!');
    setPosition(position + 0.001);
  }, [position]);

  if (!id) {
    return (
      <Center>
        <ThemedText>Missing media id.</ThemedText>
      </Center>
    );
  }

  if (!data) {
    return (
      <Container>
        <Center>
          <ActivityIndicator size="large"/>
          <LoadingText>Loading media...</LoadingText>
        </Center>
      </Container>
    );
  }

  return (
    <Container>
      <VideoContainer onPress={togglePlay}>
        <StyledVideoView
          nativeControls={false}
          player={player}
        />
        {error && (
          <OverlayCenter>
            <ErrorBox>
              <ErrorText>Playback error. Tap retry.</ErrorText>
              <RetryBtn onPress={retry}><RetryText>Retry</RetryText></RetryBtn>
            </ErrorBox>
          </OverlayCenter>
        )}
      </VideoContainer>

      <Controls>
        <Btn onPress={togglePlay}><ThemedText>{paused ? 'Play' : 'Pause'}</ThemedText></Btn>
        <Row>
          <Time>{formatTime(position + player.currentTime)}</Time>
          <SeekBar
            min={0}
            max={data.fileduration}
            value={position + player.currentTime || 0.01}
            onComplete={onSeek}
          />
          <Time>{formatTime(data.fileduration)}</Time>
        </Row>
        <Row>
          <Btn onPress={() => setVolume(volume > 0 ? 0 : 1)}>
            <ThemedText>{volume > 0 ? 'Mute' : 'Unmute'}</ThemedText>
          </Btn>
          {Platform.OS === 'web' && (
            <Btn onPress={() => toggleFullscreen()}><ThemedText>Fullscreen</ThemedText></Btn>
          )}
        </Row>
      </Controls>
    </Container>
  );
}

function formatTime(totalSeconds?: number) {
  const s = Math.floor(totalSeconds || 0);
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function toggleFullscreen() {
  if (Platform.OS !== 'web') return;
  const el = document.fullscreenElement ? document : document.documentElement;
  // @ts-ignore web only
  if (!document.fullscreenElement) (el as any).requestFullscreen?.();
  else (el as any).exitFullscreen?.();
}

const Container = styled.View`
  flex: 1;
  background-color: black;
`;

const VideoContainer = styled.Pressable`
  flex: 1;
  background-color: black;
  justify-content: center;
`;

const StyledVideoView = styled(VideoView)`
  width: 100%;
  height: 100%;
`;

const Controls = styled.View`
  padding: 12px;
  background-color: #111;
  gap: 8px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const Btn = styled.Pressable`
  padding-vertical: 8px;
  padding-horizontal: 12px;
  background-color: #333;
  border-radius: 4px;
`;

const Time = styled(ThemedText)`
  color: white;
  width: 48px;
  text-align: center;
`;

const OverlayCenter = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
`;

const ErrorBox = styled.View`
  background-color: rgba(0,0,0,0.6);
  padding: 12px;
  border-radius: 8px;
`;

const RetryBtn = styled.Pressable`
  margin-top: 8px;
  padding: 8px;
  background-color: #222;
  border-radius: 4px;
`;

const RetryText = styled(ThemedText)`
  color: white;
`;

const ErrorText = styled(ThemedText)`
  color: white;
`;

const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const LoadingText = styled(ThemedText)`
  margin-top: 12px;
`;
