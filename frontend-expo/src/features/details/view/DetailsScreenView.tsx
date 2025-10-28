import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import {default as styled} from 'styled-components/native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/src/features/shared/view/themed-text';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import type { DetailsViewModel } from '@/src/features/details/domain/useDetailsViewModel';

export type DetailsScreenViewProps = DetailsViewModel;

export function DetailsScreenView(props: DetailsScreenViewProps) {
  const theme = useTheme();
  const {
    isLoading,
    isError,
    item,
    grouped,
    activeSeason,
    setActiveSeason,
    infoVisible,
    watched,
    onToggleWatched,
    minutes,
    subTitle,
    progressPct,
    onPlay,
    onOpenImdb,
    onEpisodePress,
    onCloseInfo,
    onOpenInfo,
  } = props;

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
      {!!item.backdropUrl && <Backdrop source={{ uri: item.backdropUrl }} resizeMode="cover" />}
      <TopRight>
        <IconBtn accessibilityLabel={watched ? 'Mark unwatched' : 'Mark watched'} onPress={onToggleWatched}>
          <MaterialIcons name={watched ? 'check-box' : 'check-box-outline-blank'} size={28} color="#fff" />
        </IconBtn>
      </TopRight>
      <Overlay intensity={50} tint="dark" testID="details-blur-overlay">
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <Content>
            <Title type="title">{item.title}</Title>
            {subTitle ? <SubTitle>{subTitle}</SubTitle> : null}
            <Meta>
              {minutes ? `${minutes} min` : ''}
              {item.year ? `  •  ${item.year}` : ''}
            </Meta>
            {progressPct > 0 || watched ? (
              <ProgressRow>
                <ProgressBar>
                  <ProgressFill style={{ width: `${watched ? 100 : progressPct}%` }} />
                </ProgressBar>
                <ProgressText>{watched ? 'Watched' : `Progress: ${progressPct}%`}</ProgressText>
              </ProgressRow>
            ) : null}
            {item.overview ? <Overview numberOfLines={5}>{item.overview}</Overview> : null}
            <Actions>
              <PlayBtn accessibilityLabel="Play" onPress={onPlay}>
                <PlayText>Play</PlayText>
              </PlayBtn>
              <Secondary onPress={onOpenInfo} accessibilityLabel="Show info">
                <SecondaryText>Info</SecondaryText>
              </Secondary>
              {item.imdbUrl ? (
                <Secondary onPress={onOpenImdb} accessibilityLabel="Open IMDb">
                  <SecondaryText>IMDb</SecondaryText>
                </Secondary>
              ) : null}
            </Actions>

            {Object.keys(grouped).length > 1 || (item.type === 'tv' && Object.values(grouped).flat().length) ? (
              <TabsContainer>
                <TabsHeader horizontal showsHorizontalScrollIndicator={false}>
                  {Object.keys(grouped).map((seasonKey) => (
                    <TabPill key={seasonKey} active={String(activeSeason) === seasonKey} onPress={() => setActiveSeason(seasonKey)}>
                      <PillText>{seasonKey === '0' ? 'Extras' : `Season ${seasonKey}`}</PillText>
                    </TabPill>
                  ))}
                </TabsHeader>
                <EpisodesList>
                  {(grouped[String(activeSeason)] ?? []).map((ep) => (
                    <EpisodeRow key={String(ep.id)} onPress={() => onEpisodePress(ep.id)}>
                      <EpisodeTitle>{`S${ep.season ?? 0}E${ep.episode ?? 0}${ep.episodeTitle ? ` - ${ep.episodeTitle}` : ''}`}</EpisodeTitle>
                      <EpisodeMeta>
                        {ep.playPosition?.watched ? 'Watched' : ep.fileduration ? `${Math.round(((ep.playPosition?.position ?? 0) / (ep.fileduration || 1)) * 100)}%` : ''}
                      </EpisodeMeta>
                    </EpisodeRow>
                  ))}
                </EpisodesList>
              </TabsContainer>
            ) : null}
          </Content>
        </ScrollView>
      </Overlay>

      <Modal transparent visible={infoVisible} onRequestClose={onCloseInfo} animationType="fade">
        <ModalBackdrop as={Pressable} onPress={onCloseInfo}>
          <ModalCard>
            <Title type="title">{item.title}</Title>
            {subTitle ? <SubTitle>{subTitle}</SubTitle> : null}
            <Meta>
              {minutes ? `${minutes} min` : ''}
              {item.year ? `  •  ${item.year}` : ''}
              {typeof item.rating === 'number' ? `  •  Rating: ${Math.round(item.rating)}%` : ''}
            </Meta>
            {item.overview ? <Overview>{item.overview}</Overview> : null}
            <Actions>
              <Secondary onPress={onCloseInfo} accessibilityLabel="Close info">
                <SecondaryText>Close</SecondaryText>
              </Secondary>
            </Actions>
          </ModalCard>
        </ModalBackdrop>
      </Modal>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  background-color: #000;
`;

const Center = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Backdrop = styled.Image`
  width: 100%;
  height: 240px;
`;

const TopRight = styled.View`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
`;

const IconBtn = styled.Pressable`
  padding: 6px;
`;

const Overlay = styled(BlurView)`
  position: absolute;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
`;

const Content = styled.View`
  gap: 12px;
  padding: 16px;
`;

const Title = styled(ThemedText)`
  font-weight: 700;
  font-size: 20px;
`;

const SubTitle = styled(ThemedText)`
  opacity: 0.9;
`;

const Meta = styled(ThemedText)`
  opacity: 0.8;
`;

const ProgressRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const ProgressBar = styled.View`
  flex: 1;
  height: 6px;
  background-color: rgba(255,255,255,0.2);
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.View`
  height: 100%;
  background-color: #4caf50;
`;

const ProgressText = styled(ThemedText)`
  opacity: 0.9;
`;

const Overview = styled(ThemedText)`
  opacity: 0.9;
`;

const Actions = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-top: 8px;
`;

const PlayBtn = styled(SecondaryButton)``;

const PlayText = styled(ThemedText)`
  color: white;
  font-weight: 700;
`;

const Secondary = styled(SecondaryButton)`
  background-color: #444;
`;

const SecondaryText = styled(ThemedText)`
  color: white;
  font-weight: 700;
`;

const TabsContainer = styled.View`
  margin-top: 16px;
`;

const TabsHeader = styled.ScrollView`
  flex-grow: 0;
  margin-bottom: 8px;
`;

const TabPill = styled.Pressable<{ active?: boolean }>`
  padding: 8px 12px;
  margin-right: 8px;
  border-radius: 16px;
  background-color: ${(p: { active?: boolean }) => (p.active ? '#fff' : 'rgba(255,255,255,0.2)')};
`;

const PillText = styled(ThemedText)<{ active?: boolean }>`
  color: ${(p: { active?: boolean }) => (p.active ? '#000' : '#fff')};
  font-weight: 700;
`;

const EpisodesList = styled.View`
  border-top-width: 1px;
  border-top-color: rgba(255,255,255,0.2);
`;

const EpisodeRow = styled.Pressable`
  padding: 12px 0;
  flex-direction: row;
  justify-content: space-between;
  border-bottom-width: 1px;
  border-bottom-color: rgba(255,255,255,0.1);
`;

const EpisodeTitle = styled(ThemedText)`
  font-weight: 600;
`;

const EpisodeMeta = styled(ThemedText)`
  opacity: 0.8;
`;

const ModalBackdrop = styled.View`
  flex: 1;
  background-color: rgba(0,0,0,0.7);
  justify-content: center;
  align-items: center;
`;

const ModalCard = styled.View`
  width: 90%;
  background-color: #222;
  border-radius: 8px;
  padding: 16px;
`;
