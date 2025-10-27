import React from 'react';
import {default as styled} from 'styled-components/native';
import {CheckboxRow} from '@/src/features/shared/view/CheckboxRow';
import { SettingsAttributes } from '@/src/features/settings/model/settings';

export type AdvancedToggleRowProps = {
  draft: SettingsAttributes;
  setDraft: (next: SettingsAttributes) => void;
};

const RowRight = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  margin-bottom: 12px;
`;

export function AdvancedToggleRow({ draft, setDraft }: AdvancedToggleRowProps) {
  return (
    <RowRight>
      <CheckboxRow label="Show advanced" value={!!draft.advanced} onValueChange={(v) => setDraft({ ...draft, advanced: v })} />
    </RowRight>
  );
}

