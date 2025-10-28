import { Picker } from "@react-native-picker/picker";
import {default as styled} from "styled-components/native";
import type { DefaultTheme } from "styled-components/native";

type PickerType = typeof Picker;

export const ThemedPicker:PickerType = styled(Picker)`
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
  border-width: 1px;
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
  padding-horizontal: 10px;
  padding-vertical: 8px;
  border-radius: 6px;
  background-color: transparent;
`;
