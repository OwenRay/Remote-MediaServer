import React from 'react';
import { CardTitle, Card } from '@/src/features/shared/view/Card';
import {TextRow} from '@/src/features/shared/view/TextRow';
import {CheckboxRow} from '@/src/features/shared/view/CheckboxRow';
import { SettingsAttributes } from '@/src/features/settings/model/settings';

export type SslSettingsCardProps = {
  draft: SettingsAttributes;
  setDraft: (next: SettingsAttributes) => void;
};

export function SslSettingsCard({ draft, setDraft }: SslSettingsCardProps) {
  return (
    <Card>
      <CardTitle>SSL</CardTitle>
      <TextRow label="SSL Subdomain" value={draft.ssldomain ?? ''} onChangeText={(t) => setDraft({ ...draft, ssldomain: t })} />
      <TextRow label="SSL port" value={draft.sslport ? String(draft.sslport) : ''} keyboardType="numeric" onChangeText={(t) => setDraft({ ...draft, sslport: Number(t) as any })} />
      <TextRow label="Email" value={draft.sslemail ?? ''} keyboardType="email-address" onChangeText={(t) => setDraft({ ...draft, sslemail: t })} />
      <CheckboxRow label="Automatically redirect to https" value={!!draft.sslredirect} onValueChange={(v) => setDraft({ ...draft, sslredirect: v })} />
    </Card>
  );
}

