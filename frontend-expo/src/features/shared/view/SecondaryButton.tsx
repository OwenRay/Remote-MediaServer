import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { default as styled, DefaultTheme } from 'styled-components/native';

export type SecondaryButtonProps = PressableProps & {
  children?: React.ReactNode;
};

// Generic secondary-colored pressable button
export const SecondaryButton: React.FC<SecondaryButtonProps> = ({ children, ...rest }) => {
  return (
    <BaseButton accessibilityRole="button" {...rest}>
      {children}
    </BaseButton>
  );
};

const BaseButton: typeof Pressable = styled(Pressable)`
  padding-horizontal: 16px;
  padding-vertical: 10px;
  border-radius: 8px;
  background-color: ${({theme, disabled}: { theme: DefaultTheme; disabled?: boolean }) =>
    disabled ? '#909090' : theme.colors.primary};
`;
