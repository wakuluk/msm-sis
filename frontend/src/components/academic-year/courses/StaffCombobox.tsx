import { useEffect } from 'react';
import type { TextInputProps } from '@mantine/core';
import { CloseButton, Combobox, Loader, Stack, Text, TextInput, useCombobox } from '@mantine/core';
import type { StaffSelectOption } from './courseSectionsWorkspaceTypes';

type StaffComboboxProps = {
  label: string;
  placeholder: string;
  options: StaffSelectOption[];
  value: string;
  selectedStaffId: number | null;
  disabled: boolean;
  loading: boolean;
  styles?: TextInputProps['styles'];
  onSearchChange: (value: string) => void;
  onSelect: (staffId: number, label: string) => void;
  onClear: () => void;
};

export function StaffCombobox({
  label,
  placeholder,
  options,
  value,
  selectedStaffId,
  disabled,
  loading,
  styles,
  onSearchChange,
  onSelect,
  onClear,
}: StaffComboboxProps) {
  const combobox = useCombobox({
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
    onDropdownClose: () => combobox.resetSelectedOption(),
  });
  const searchIsReady = value.trim().length >= 2;
  const dropdownContent = loading ? (
    <Combobox.Empty>Searching...</Combobox.Empty>
  ) : !searchIsReady ? (
    <Combobox.Empty>Type at least 2 characters</Combobox.Empty>
  ) : options.length === 0 ? (
    <Combobox.Empty>No staff found</Combobox.Empty>
  ) : (
    options.map((option) => (
      <Combobox.Option value={option.value} key={option.value}>
        <Stack gap={0}>
          <Text size="sm">{option.label}</Text>
          {option.email ? (
            <Text size="xs" c="dimmed">
              {option.email}
            </Text>
          ) : null}
        </Stack>
      </Combobox.Option>
    ))
  );

  useEffect(() => {
    combobox.updateSelectedOptionIndex('active');
  }, [combobox, loading, options]);

  return (
    <Combobox
      store={combobox}
      disabled={disabled}
      onOptionSubmit={(optionValue) => {
        const selectedOption = options.find((option) => option.value === optionValue);

        if (selectedOption) {
          onSelect(Number(optionValue), selectedOption.label);
        }

        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <TextInput
          label={label}
          placeholder={placeholder}
          value={value}
          readOnly={disabled}
          disabled={disabled}
          styles={styles}
          rightSection={
            loading ? (
              <Loader size="xs" />
            ) : value && !disabled ? (
              <CloseButton
                size="sm"
                aria-label={`Clear ${label.toLowerCase()}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  onClear();
                  combobox.closeDropdown();
                }}
              />
            ) : null
          }
          onFocus={() => {
            combobox.openDropdown();
          }}
          onClick={() => {
            combobox.openDropdown();
          }}
          onChange={(event) => {
            onSearchChange(event.currentTarget.value);
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex('active');
          }}
          onBlur={() => {
            window.setTimeout(() => {
              combobox.closeDropdown();

              if (selectedStaffId === null) {
                onClear();
              }
            }, 0);
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>{dropdownContent}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
