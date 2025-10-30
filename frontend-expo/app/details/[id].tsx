import React from 'react';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { DetailsScreenView } from '@/src/features/details/view/DetailsScreenView';
import { useDetailsViewModel } from '@/src/features/details/domain/useDetailsViewModel';
import { BlurView } from 'expo-blur';

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewModel = useDetailsViewModel(String(id));
  const navigation = useNavigation();

  React.useEffect(() => {
    navigation.setOptions?.({
      title: viewModel.item?.title ?? 'Details',
      headerTransparent: true,
      headerBackground: () => (
        <BlurView
          experimentalBlurMethod="dimezisBlurView"
          intensity={50}
          tint="dark"
          style={{ width: '100%', height: '100%' }}
        />
      ),
    });
  }, [navigation, viewModel.item?.title]);

  return <DetailsScreenView {...viewModel} />;
}
