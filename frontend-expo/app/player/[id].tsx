import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {ThemedText} from '@/components/themed-text';
import {useLocalSearchParams} from 'expo-router';
import {useVideoPlayer, VideoView} from 'expo-video';
import {BASE_URL} from '@/src/services/api/base';
import {useWritePlayPositionMutation} from '@/src/services/api/playback';
import {SeekBar} from '@/src/components/SeekBar';
import {useGetItemQuery} from '@/src/services/api/media';

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
    return {uri: `${BASE_URL}/ply/${id}/${seek}`};
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
      <View style={styles.center}>
        <Text>Missing media id.</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large"/>
          <ThemedText style={styles.loadingText}>Loading media...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={togglePlay} style={styles.videoContainer}>
        <VideoView
          style={{width: '100%', height: '100%'}}
          nativeControls={false}
          player={player}
        />
        {buffering && (
          <View style={styles.overlayCenter}><ActivityIndicator/></View>
        )}
        {error && (
          <View style={[styles.overlayCenter, styles.errorBox]}>
            <Text style={styles.errorText}>Playback error. Tap retry.</Text>
            <Pressable onPress={retry} style={styles.retryBtn}><Text style={styles.retryText}>Retry</Text></Pressable>
          </View>
        )}
      </Pressable>

      <View style={styles.controls}>
        <Pressable onPress={togglePlay} style={styles.btn}><Text>{paused ? 'Play' : 'Pause'}</Text></Pressable>
        <View style={styles.row}>
          <Text style={styles.time}>{formatTime(position + player.currentTime)}</Text>
          <SeekBar
            min={0}
            max={data.fileduration}
            value={position + player.currentTime || 0.01}
            onComplete={onSeek}
          />
          <Text style={styles.time}>{formatTime(data.fileduration)}</Text>
        </View>
        <View style={styles.row}>
          <Pressable onPress={() => setVolume(volume > 0 ? 0 : 1)} style={styles.btn}>
            <Text>{volume > 0 ? 'Mute' : 'Unmute'}</Text>
          </Pressable>
          {Platform.OS === 'web' && (
            <Pressable onPress={() => toggleFullscreen()} style={styles.btn}><Text>Fullscreen</Text></Pressable>
          )}
        </View>
      </View>
    </View>
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

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: 'black'},
  videoContainer: {flex: 1, backgroundColor: 'black', justifyContent: 'center'},
  controls: {padding: 12, backgroundColor: '#111', gap: 8},
  row: {flexDirection: 'row', alignItems: 'center', gap: 8},
  slider: {flex: 1},
  btn: {paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#333', borderRadius: 4},
  time: {color: 'white', width: 48, textAlign: 'center'},
  overlayCenter: {...StyleSheet.absoluteFillObject as any, alignItems: 'center', justifyContent: 'center'},
  errorBox: {backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 8},
  retryBtn: {marginTop: 8, padding: 8, backgroundColor: '#222', borderRadius: 4},
  retryText: {color: 'white'},
  errorText: {color: 'white'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {marginTop: 12},
});
