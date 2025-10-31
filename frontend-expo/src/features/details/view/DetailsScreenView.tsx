import React from 'react';
import {ActivityIndicator, Pressable, ScrollView, useWindowDimensions} from 'react-native';
import { useTheme } from '@react-navigation/native';
import {default as styled, DefaultTheme} from 'styled-components/native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { DetailsInfoDialog } from '@/src/features/details/view/DetailsInfoDialog';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import { DownloadButton as DownloadBtn } from '@/src/features/shared/view/DownloadButton';
import { ProgressBar as SharedProgressBar } from '@/src/features/shared/view/ProgressBar';
import type { DetailsViewModel } from '@/src/features/details/domain/useDetailsViewModel';

export type DetailsScreenViewProps = DetailsViewModel;

export function DetailsScreenView(props: DetailsScreenViewProps) {
  const {height} = useWindowDimensions();
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
    <>
      {!!item.backdropUrl && <Backdrop source={{ uri: item.backdropUrl }} resizeMode="cover" />}
      <Container>
        <TopRight>
        </TopRight>
        <ScrollView contentContainerStyle={{minHeight: '100%'}}>
          <Overlay height={height} experimentalBlurMethod="dimezisBlurView" intensity={50} tint="dark" testID="details-blur-overlay" hasEpisodes={!!grouped}>
            {progressPct > 0 || watched ? (
              <ProgressRow>
                <SharedProgressBar progress={(watched ? 1 : (progressPct / 100))} />
              </ProgressRow>
            ) : null}
            <Content>
              <PlayBtn accessibilityLabel="Play" onPress={onPlay}>
                <MaterialIcons name={'play-arrow'} size={24} color={'white'} />
              </PlayBtn>
              <Title type="title">{item.title}</Title>
              {subTitle ? <SubTitle>{subTitle}</SubTitle> : null}
              <Meta>
                {minutes ? `${minutes} min` : ''}
                {item.year ? `  •  ${item.year}` : ''}
              </Meta>
              {item.overview ? <Overview numberOfLines={5}>{item.overview}</Overview> : null}
              <Actions>
                <Secondary onPress={onOpenInfo} accessibilityLabel="Show info">
                  <SecondaryText>Info</SecondaryText>
                </Secondary>
                <Secondary accessibilityLabel={watched ? 'Mark unwatched' : 'Mark watched'} onPress={onToggleWatched}>
                  <MaterialIcons name={watched ? 'check-box' : 'check-box-outline-blank'} size={16} color="#fff" />
                  <SecondaryText>{watched ? 'Watched' : 'Mark Watched'}</SecondaryText>
                </Secondary>
                {item.imdbUrl ? (
                  <Pressable onPress={onOpenImdb} accessibilityLabel="Open IMDb" role={'link'}>
                    <StyledIMDB  source={require('@/assets/images/imdb.svg')}/>
                  </Pressable>
                ) : null}
              </Actions>

              {grouped ? (
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
          </Overlay>
        </ScrollView>

        <DetailsInfoDialog visible={infoVisible} onClose={onCloseInfo} item={item} subTitle={subTitle} />
      </Container>
    </>
  );
}

const Container = styled.View`
  flex: 1;
  margin-top: 60px;
`;

const Center = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Backdrop = styled.Image`
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  position:absolute;
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


const Overlay = styled(BlurView)<{height:number, hasEpisodes:boolean}>`
  background-color: rgba(0,0,0,0.5);
  /* top: max(calc(100vh - 320px), calc(100cqh - 100%)); */
  /* margin-top: ${({height}:{height:number}) => `max(calc(${height-320}px), calc(${height}px - 100%));`}; */
  ${({hasEpisodes, height}:{hasEpisodes:boolean, height:number}) => `
    ${hasEpisodes ? `margin-top: ${height - 320}px;` : 'position: absolute; bottom: 0px;'}
  `}
  height: auto;
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

const Overview = styled(ThemedText)`
  opacity: 0.9;
`;

const Actions = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-top: 8px;
`;

const PlayBtn = styled(SecondaryButton)`
    position:absolute;
    right: 20px;
    top: -45px;
    width:64px;
    height:64px;
    border-radius: 32px;
    justify-content: center;
    align-items: center;
    shadow-color: #000;
    shadow-offset: 0px 4px;
    shadow-opacity: 0.2;
    shadow-radius: 4px;

`;

const Secondary = styled(SecondaryButton)`
  background-color: #444;
  flex-direction: row;
  gap: 8px;
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
  color: ${(p: { active?: boolean, theme:DefaultTheme }) => (p.active ? p.theme.colors.primary : 'white')};
  background-color: ${(p: { active?: boolean, theme:DefaultTheme }) => (p.active ? p.theme.colors.background : 'rgba(0,0,0,0.2)')};
  border-width: ${(p: { active?: boolean }) => (p.active ? '1px' : '0')};
  border-color: ${(p: { active?: boolean, theme: DefaultTheme }) => (p.active ? p.theme.colors.primary : 'white')};

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

const StyledIMDB = styled.Image`
  width: 74px;
  height: 36px;
`;
