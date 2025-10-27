import React from 'react';
import { Card, CardTitle, HelpText } from '@/src/features/shared/view/Card';
import { CheckboxRow } from '@/src/features/shared/view/CheckboxRow';

export type ModulesCardProps = {
  availableModules: string[];
  hasModule: (name: string) => boolean;
  toggleModule: (name: string) => void;
};

export function ModulesCard({ availableModules, hasModule, toggleModule }: ModulesCardProps) {
  return (
    <Card>
      <CardTitle>Modules</CardTitle>
      {(availableModules ?? []).map((m) => (
        <CheckboxRow key={m} label={`${m.replace('_', ' ')}`} value={hasModule(m)} onValueChange={() => toggleModule(m)} />
      ))}
      <HelpText>Changing these requires a restart of the mediaserver</HelpText>
    </Card>
  );
}
