import React, {useEffect, useState} from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {ThemedText} from '@/components/themed-text';
import {useGetLibrariesQuery} from '@/src/services/api/media';
import ThemedTextInput from "@/components/form/ThemedTextInput";

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
              <Picker
                selectedValue={filters.libraryId}
                onValueChange={(itemValue) => onFiltersChange({...filters, libraryId: itemValue})}
                testID="library-picker"
              >
                <Picker.Item label="All" value={undefined}/>
                {(libraries ?? []).map((l) => (
                  <Picker.Item key={l.id} label={l.name} value={l.id}/>
                ))}
              </Picker>
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
            <ThemedText style={styles.label}>Sort by</ThemedText>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={filters.sort ?? 'date_added:DESC'}
                onValueChange={(itemValue) => onFiltersChange({...filters, sort: itemValue})}
                testID="sort-picker"
              >
                {sortOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value}/>
                ))}
              </Picker>
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
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  field: {
    flex: 1,
    minWidth: 120,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  label: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontWeight: '600',
  },
  pickerContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  input: {
    flexGrow: 10,
    width: '100%',
  },
});
