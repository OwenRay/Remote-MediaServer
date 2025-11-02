import React, {useEffect, useState} from 'react';
import {default as styled} from 'styled-components/native';
import {useWindowDimensions} from 'react-native';
import { useLibraries } from '@/src/features/library/model/useLibraries';
import {ThemedTextInput} from "@/src/features/shared/view/ThemedTextInput";
import {ThemedText} from "@/src/features/shared/view/ThemedText";
import {ThemedPicker} from "@/src/features/shared/view/ThemedPicker";
import {Card} from "@/src/features/shared/view/Card";
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import {useSafeAreaInsets} from "react-native-safe-area-context";

export type SearchBarProps = {
  value: string;
  onChange: (text: string) => void;
  filters: FiltersState;
  onFiltersChange: (next: FiltersState) => void;
};

export type FiltersState = {
  libraryId?: string;
  sort?: string;
  distinct?: string; // when set to 'external-id' groups items by external id
};

export function SearchBar({
                            value,
                            onChange,
                            filters,
                            onFiltersChange
                          }: SearchBarProps) {
  const {top} = useSafeAreaInsets();
  const [text, setText] = useState(value);
  const {width} = useWindowDimensions();
  const { libraries } = useLibraries();

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
    <>
      <Content style={{paddingTop: top || 8}} isWide={isWideScreen}>
        <FiltersContainer>
          <Field>
            <PickerLabel type={'default'}>Library</PickerLabel>
            <PickerContainer>
              <ThemedPicker
                selectedValue={filters.libraryId}
                onValueChange={(itemValue) => onFiltersChange({...filters, libraryId: itemValue})}
                testID="library-picker"
                options={libraries ? [
                  {label: 'All', value: undefined},
                  ...libraries.map((l) => ({label: l.name, value: l.id}))
                ] : [{label: 'All', value: undefined}]}
              />
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
            <PickerLabel type={'default'}>Sort by</PickerLabel>
            <PickerContainer>
              <ThemedPicker
                selectedValue={filters.sort ?? 'date_added:DESC'}
                onValueChange={(itemValue) => onFiltersChange({...filters, sort: itemValue})}
                testID="sort-picker"
                options={sortOptions}
              />
            </PickerContainer>
          </Field>

          <SecondaryButton
            testID="group-toggle"
            onPress={() => onFiltersChange({
              ...filters,
              distinct: filters.distinct ? undefined : 'external-id',
            })}
            accessibilityLabel="group-toggle"
          >
            <ThemedText>{filters.distinct ? 'Ungroup' : 'Group'}</ThemedText>
          </SecondaryButton>
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
    </>
  );
}

const Content = styled(Card)<{ isWide: boolean }>`
  margin-bottom: 0;
  padding-horizontal: 8px;
  gap: 8px;
  flex-direction: ${({isWide}: { isWide: boolean }) => isWide ? 'row' : 'column'};
  justify-content: stretch;
  width: 100%;
  position: relative;
  z-index: 999
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
`;

const StyledTextInput = styled(ThemedTextInput)`
  flex-grow: 1;
`;

const PickerLabel = styled(ThemedText)`
  padding-left: 6px;
`

