import React from 'react';
import { ScrollView } from 'react-native';
import { default as styled} from 'styled-components/native';

import { ThemedText } from '@/src/features/shared/view/themed-text';
import {useSettingsForm} from '@/src/features/settings/model/useSettingsForm';
import {FrontendCard} from '@/src/features/settings/view/FrontendCard';
import {SaveBar} from '@/src/features/settings/view/SaveBar';
import {ServerSettingsCard} from '@/src/features/settings/view/ServerSettingsCard';
import {AdvancedToggleRow} from '@/src/features/settings/view/AdvancedToggleRow';
import {SslSettingsCard} from '@/src/features/settings/view/SslSettingsCard';
import {SharingSettingsCard} from '@/src/features/settings/view/SharingSettingsCard';
import {LibrariesEditor} from '@/src/features/settings/view/LibrariesEditor';
import {ModulesCard} from '@/src/features/settings/view/ModulesCard';

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

  return (
    <ScreenContainer>
      <ScrollView>
        <ContentPad>
          <SaveBar isSaving={isSaving} onSave={onSave} />
          <FrontendCard serverEndpoint={serverEndpoint} setServerEndpoint={setServerEndpoint} />

          {!draft ? (
            <Center><ThemedText>{isFetching ? 'Loading...' : 'No settings'}</ThemedText></Center>
          ) : (
            <>
              <AdvancedToggleRow draft={draft} setDraft={setDraft} />
              <ServerSettingsCard draft={draft} setDraft={setDraft} />
              {hasModule('ssl') && <SslSettingsCard draft={draft} setDraft={setDraft} />}
              {hasModule('sharing') && <SharingSettingsCard draft={draft} setDraft={setDraft} />}
              <LibrariesEditor draft={draft} setDraft={setDraft} />
              <ModulesCard availableModules={availableModules} hasModule={hasModule} toggleModule={toggleModule} />
            </>
          )}
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
