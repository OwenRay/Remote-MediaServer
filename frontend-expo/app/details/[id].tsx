import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { DetailsScreenView } from '@/src/features/details/view/DetailsScreenView';
import { useDetailsViewModel } from '@/src/features/details/domain/useDetailsViewModel';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewModel = useDetailsViewModel(String(id));
  return <DetailsScreenView {...viewModel} />;
}
