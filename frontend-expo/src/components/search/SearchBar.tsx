import React, {useEffect, useState} from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useGetLibrariesQuery} from '@/src/services/api/media';
import ThemedTextInput from "@/src/components/form/ThemedTextInput";
import {ThemedText} from "@/src/components/themed-text";
import {ThemedPicker} from "@/src/components/form/ThemedPicker";

export type SearchBarProps = {
  value: string;
  onChange: (text: string) => void;
  filters: FiltersState;
  onFiltersChange: (next: FiltersState) => void;
};

export type FiltersState = {
  libraryId?: string;
  sort?: string;
};

export default function SearchBar({
                                    value,
                                    onChange,
                                    filters,
                                    onFiltersChange
                                  }: SearchBarProps) {
  const [text, setText] = useState(value);
  const {width} = useWindowDimensions();
  const {data: libraries} = useGetLibrariesQuery();

  const sortOptions = [
    {label: 'Date added', value: 'date_added:DESC'},
    {label: 'Title', value: 'title'},
    {label: 'Release date', value: 'release-date:DESC'},
  ];

  // Lightweight debounce to avoid spamming API as user types
  useEffect(() => {
    const id = setTimeout(() => onChange(text), 300);
    return () => clearTimeout(id);
  }, [text, onChange]);

  useEffect(() => {
    setText(value);
  }, [value]);

  const isWideScreen = width >= 768; // Adjust breakpoint as needed

  return (
    <View style={styles.container}>
      <View style={[
        styles.content,
        {flexDirection: isWideScreen ? 'row' : 'column'}
      ]}>
        <View style={[
          styles.filtersContainer,
          {flexDirection: isWideScreen ? 'row' : 'column'}
        ]}>
          <View style={styles.field}>
            <ThemedText style={styles.label}>Library</ThemedText>
            <View style={styles.pickerContainer}>
              <ThemedPicker
                selectedValue={filters.libraryId}
                onValueChange={(itemValue) => onFiltersChange({...filters, libraryId: itemValue})}
                testID="library-picker"
              >
                <Picker.Item label="All" value={undefined}/>
                {(libraries ?? []).map((l) => (
                  <Picker.Item key={l.id} label={l.name} value={l.id}/>
                ))}
              </ThemedPicker>
            </View>
          </View>

          {isWideScreen && (
            <ThemedTextInput
              style={styles.input}
              accessibilityLabel="search-input"
              placeholder={"Search..."}
              value={text}
              onChangeText={setText}
              returnKeyType="search"
            />
          )}

          <View style={styles.field}>
            <ThemedText type={'default'} style={styles.label}>Sort by</ThemedText>
            <View style={styles.pickerContainer}>
              <ThemedPicker
                selectedValue={filters.sort ?? 'date_added:DESC'}
                onValueChange={(itemValue) => onFiltersChange({...filters, sort: itemValue})}
                testID="sort-picker"
              >
                {sortOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value}/>
                ))}
              </ThemedPicker>
            </View>
          </View>
        </View>

        {!isWideScreen && (
          <ThemedTextInput
            style={styles.input}
            accessibilityLabel="search-input"
            placeholder={"Search..."}
            value={text}
            onChangeText={setText}
            returnKeyType="search"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  content: {
    gap: 8,
  },
  filtersContainer: {
    flex: 1,
    gap: 8,
    alignItems: 'flex-end',
  },
  field: {
    minWidth: 150,
    flex: 1,
    overflow: 'hidden',
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  pickerContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  input: {
    width: '100%',
    marginBottom: 8,
  },
});
