import { Picker } from "@react-native-picker/picker";
import styled from "styled-components/native";
import type { DefaultTheme } from "styled-components/native";

type PickerType = typeof Picker;

export const ThemedPicker:PickerType = styled(Picker)`
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.background};
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
  border-width: 1px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
  padding-horizontal: 10px;
  padding-vertical: 8px;
  border-radius: 6px;
`;
