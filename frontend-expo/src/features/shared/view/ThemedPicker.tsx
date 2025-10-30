import React, {useState} from 'react';
import {TouchableOpacity, ViewStyle, Text} from 'react-native';
import {default as styled} from 'styled-components/native';
import type {DefaultTheme} from 'styled-components/native';

type Option = {
  value: any;
  label: string;
};

export type ThemedPickerProps = {
  selectedValue?: any;
  onValueChange?: (value: any, index: number) => void;
  options: Option[];
  testID?: string;
  style?: ViewStyle | ViewStyle[];
};

// A lightweight custom dropdown that mimics a picker and shows options underneath on tap
export function ThemedPicker({selectedValue, onValueChange, options, testID, style}: ThemedPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedIndex = options.findIndex(o => o.value === selectedValue);
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex]?.label : '';

  const handleSelect = (value: any, index: number) => {
    setOpen(false);
    onValueChange?.(value, index);
  };

  return (
    <Wrapper style={style} testID={testID}>
      <Trigger onPress={() => setOpen(o => !o)} accessibilityRole="button"
               accessibilityLabel={testID ? `${testID}-trigger` : undefined}>
        <ValueText numberOfLines={1}>{selectedLabel}</ValueText>
        <ChevronText accessibilityLabel="chevron">▾</ChevronText>
      </Trigger>
      {open && (
        <Options role="menu" accessibilityLabel={testID ? `${testID}-options` : undefined}>
          {options.map((opt, idx) => (
            <OptionRow
              key={String(opt.value) + idx}
              onPress={() => handleSelect(opt.value, idx)}
              accessibilityRole="menuitem"
              testID={testID ? `${testID}-option-${idx}` : undefined}
            >
              <OptionText>{opt.label}</OptionText>
            </OptionRow>
          ))}
        </Options>
      )}
    </Wrapper>
  );
}
const Wrapper = styled.View`
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
  border-width: 0.5px;
  padding-horizontal: 10px;
  border-radius: 6px;
  background-color: transparent;
  position: relative;
  z-index: 99;
`;

const Trigger = styled(TouchableOpacity)`
  min-height: 42px;
  height: 42px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ValueText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
`;

const ChevronText = styled(Text)`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
`;

const Options = styled.View`
  margin-top: 6px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
  border-width: 1px;
  border-radius: 6px;
  overflow: hidden;
  position: absolute;
  top: 42px;
  left:0px;
  right: 0px;
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.card};
  z-index: 10000;
`;

const OptionRow = styled(TouchableOpacity)`
  padding-vertical: 10px;
  padding-horizontal: 10px;
  background-color: transparent;
`;

const OptionText = styled.Text`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
`;
// ... rest of the styled components remain the same
