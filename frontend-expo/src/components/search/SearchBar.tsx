import React, {useEffect, useState} from 'react';
import styled from 'styled-components/native';
import { useWindowDimensions } from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useGetLibrariesQuery} from '@/src/services/api/media';
import {ThemedTextInput} from "@/src/components/form/ThemedTextInput";
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
      <Content isWide={isWideScreen}>
        <FiltersContainer>
          <Field>
            <ThemedText>Library</ThemedText>
            <PickerContainer>
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
            </PickerContainer>
          </Field>

          {isWideScreen && (
            <StyledTextInput
              accessibilityLabel="search-input"
              placeholder={"Search..."}
              value={text}
              onChangeText={setText}
              returnKeyType="search"
            />
          )}

          <Field>
            <ThemedText type={'default'}>Sort by</ThemedText>
            <PickerContainer>
              <ThemedPicker
                selectedValue={filters.sort ?? 'date_added:DESC'}
                onValueChange={(itemValue) => onFiltersChange({...filters, sort: itemValue})}
                testID="sort-picker"
              >
                {sortOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value}/>
                ))}
              </ThemedPicker>
            </PickerContainer>
          </Field>
        </FiltersContainer>

        {!isWideScreen && (
          <StyledTextInput
            accessibilityLabel="search-input"
            placeholder={"Search..."}
            value={text}
            onChangeText={setText}
            returnKeyType="search"
          />
        )}
      </Content>
  );
}

const Content = styled.View<{ isWide: boolean }>`
  padding: 16px;
  gap: 8px;
  flex-direction: ${({ isWide }: { isWide: boolean }) => {
    console.log('isWide', isWide);
    return (isWide ? 'row' : 'column')
  }};
  justify-content: stretch;
  width: 100%;
`;

const FiltersContainer = styled.View`
  gap: 8px;
  align-items: flex-end;
  flex-direction: row;
  width: 100%;
`;

const Field = styled.View`
  min-width: 150px;
  flex: 1;
`;

const PickerContainer = styled.View`
  padding-bottom: 8px;
`;

const StyledTextInput = styled(ThemedTextInput)`
  width: 100%;
  flex-grow: 1;
  marginBottom: 8px;
`;
