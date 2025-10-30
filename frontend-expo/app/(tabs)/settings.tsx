import React, { useMemo, useState } from 'react';
import {ScrollView, TouchableOpacity, View} from 'react-native';
import {default as styled, DefaultTheme} from 'styled-components/native';

import { ThemedText } from '@/src/features/shared/view/ThemedText';
import {useSettingsForm} from '@/src/features/settings/model/useSettingsForm';
import {FrontendCard} from '@/src/features/settings/view/FrontendCard';
import {SaveBar} from '@/src/features/settings/view/SaveBar';
import {ServerSettingsCard} from '@/src/features/settings/view/ServerSettingsCard';
import {SslSettingsCard} from '@/src/features/settings/view/SslSettingsCard';
import {SharingSettingsCard} from '@/src/features/settings/view/SharingSettingsCard';
import {LibrariesEditor} from '@/src/features/settings/view/LibrariesEditor';
import {ModulesCard} from '@/src/features/settings/view/ModulesCard';


type TabKey = 'frontend' | 'advanced' | 'server' | 'ssl' | 'sharing' | 'libraries' | 'modules';

export default function SettingsScreen() {
  const {
    draft,
    setDraft,
    serverEndpoint,
    setServerEndpoint,
    availableModules,
    isFetching,
    isSaving,
    hasModule,
    toggleModule,
    onSave,
  } = useSettingsForm();

  const [activeTab, setActiveTab] = useState<TabKey>('frontend');

  const tabs: { key: TabKey; label: string }[] = useMemo(
    () => [
      { key: 'frontend', label: 'Frontend' },
      { key: 'server', label: 'Server' },
      { key: 'ssl', label: 'SSL' },
      { key: 'sharing', label: 'Sharing' },
      { key: 'libraries', label: 'Libraries' },
      { key: 'modules', label: 'Modules' },
    ],
    []
  );

  const renderTabContent = () => {
    if (activeTab === 'frontend') {
      return (
        <FrontendCard
          serverEndpoint={serverEndpoint}
          setServerEndpoint={setServerEndpoint}
        />
      );
    }

    if (!draft) {
      return (
        <Center>
          <ThemedText>{isFetching ? 'Loading...' : 'No settings'}</ThemedText>
        </Center>
      );
    }

    switch (activeTab) {
      case 'server':
        return <ServerSettingsCard draft={draft} setDraft={setDraft} />;
      case 'ssl':
        return hasModule('ssl') ? (
          <SslSettingsCard draft={draft} setDraft={setDraft} />
        ) : (
          <Center><ThemedText>SSL module is not enabled</ThemedText></Center>
        );
      case 'sharing':
        return hasModule('sharing') ? (
          <SharingSettingsCard draft={draft} setDraft={setDraft} />
        ) : (
          <Center><ThemedText>Sharing module is not enabled</ThemedText></Center>
        );
      case 'libraries':
        return <LibrariesEditor draft={draft} setDraft={setDraft} />;
      case 'modules':
        return (
          <ModulesCard
            availableModules={availableModules}
            hasModule={hasModule}
            toggleModule={toggleModule}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer>
      <ScrollView>
        <ContentPad>


          <TabsRow horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map(({ key, label }) => (
              <TabButton
                key={key}
                active={activeTab === key}
                onPress={() => setActiveTab(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: activeTab === key }}
              >
                <TabButtonText active={activeTab === key}>{label}</TabButtonText>
              </TabButton>
            ))}
          </TabsRow>
          {renderTabContent()}

          <TopWrapper>
            { activeTab !== 'frontend' ? <SaveBar isSaving={isSaving} onSave={onSave} /> : undefined}
          </TopWrapper>
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
`;

const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const TabsRow = styled.ScrollView`
  margin-bottom: 12px;
  width: 100%;
`;

const TabButton = styled(TouchableOpacity)<{ active: boolean }>`
  padding: 8px 12px;
  margin-right: 8px;
  border-radius: 8px;
  background-color:transparent;
  border-width: ${({active}: { active: boolean }) => (active ? '1px' : '0')};
  border-color: ${({theme}: {theme:DefaultTheme}) => theme.colors.primary};
`;

const TabButtonText = styled.Text<{ active: boolean }>`
  color: ${({ active }: { active: boolean }) => (active ? '#fff' : '#bbb')};
  font-weight: 600;
`;

const TopWrapper = styled(View)`
  flex-direction: row;
  justify-content: right;
  margin-bottom: 24px;
`;
