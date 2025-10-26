import React from 'react';
import {TextInput, StyleSheet, TextInputProps} from 'react-native';
import {useTheme} from '@react-navigation/native';

interface ThemedTextInputProps extends TextInputProps {
  containerStyle?: object;
}

export default function ThemedTextInput({style, containerStyle, ...props}: ThemedTextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      style={
        [
          styles.input,
          {
            color: theme.colors.text, borderColor:
            theme.colors.border
          }
          ,
          style,
          containerStyle,
        ]
      }
      placeholderTextColor={theme.colors.border}
      {...
        props
      }
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 120,
  },
});
