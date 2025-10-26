import {Picker, PickerProps} from "@react-native-picker/picker";
import React from "react";
import {useTheme} from "@react-navigation/native";

export const ThemedPicker = (props:PickerProps) => {
  const {colors} = useTheme();
  return (
    <Picker
      itemStyle={{borderWidth: 0}}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
        color: colors.text,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 0,
        marginRight: 8,
      }}
      {...props}
    >
    </Picker>
  )
}
