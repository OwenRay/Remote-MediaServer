import {Picker, PickerProps} from "@react-native-picker/picker";
import React from "react";
import {useTheme} from "@react-navigation/native";

export const ThemedPicker = <T extends unknown>(props: PickerProps<T>) => {
  const {colors} = useTheme();
  return (
    <Picker<T>
      itemStyle={{borderWidth: 0}}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
        borderWidth: 1,
        color: colors.text,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 6,
      }}
      {...props}
    >
    </Picker>
  )
}
