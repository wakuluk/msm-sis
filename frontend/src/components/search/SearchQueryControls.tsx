import { Box, Select } from '@mantine/core';

type StringOption<T extends string = string> = {
  value: T;
  label: string;
};

type SearchQueryControlsProps<TSortBy extends string, TSortDirection extends string> = {
  size: string;
  sortBy: TSortBy;
  sortDirection: TSortDirection;
  sizeOptions: ReadonlyArray<StringOption>;
  sortByOptions: ReadonlyArray<StringOption<TSortBy>>;
  sortDirectionOptions: ReadonlyArray<StringOption<TSortDirection>>;
  onSizeChange: (value: string | null) => void;
  onSortByChange: (value: string | null) => void;
  onSortDirectionChange: (value: string | null) => void;
  labelMode: 'label' | 'placeholder';
  widths?: {
    size?: number | string;
    sortBy?: number | string;
    sortDirection?: number | string;
  };
};

const queryControlStyles = {
  label: { display: 'block', width: '100%', textAlign: 'right' as const },
};

function getFieldProps(labelMode: 'label' | 'placeholder', label: string) {
  return labelMode === 'label'
    ? { label, placeholder: undefined }
    : { label: undefined, placeholder: label };
}

export function SearchQueryControls<TSortBy extends string, TSortDirection extends string>({
  size,
  sortBy,
  sortDirection,
  sizeOptions,
  sortByOptions,
  sortDirectionOptions,
  onSizeChange,
  onSortByChange,
  onSortDirectionChange,
  labelMode,
  widths,
}: SearchQueryControlsProps<TSortBy, TSortDirection>) {
  return (
    <>
      <Box miw={130} maw={widths?.size ?? 150} style={{ flex: '0 1 9rem' }}>
        <Select
          allowDeselect={false}
          data={[...sizeOptions]}
          value={size}
          aria-label="Page size"
          styles={queryControlStyles}
          onChange={onSizeChange}
          {...getFieldProps(labelMode, 'Page size')}
        />
      </Box>
      <Box miw={130} maw={widths?.sortBy ?? 150} style={{ flex: '0 1 9rem' }}>
        <Select
          allowDeselect={false}
          data={[...sortByOptions]}
          value={sortBy}
          aria-label="Sort by"
          styles={queryControlStyles}
          onChange={onSortByChange}
          {...getFieldProps(labelMode, 'Sort by')}
        />
      </Box>
      <Box miw={130} maw={widths?.sortDirection ?? 150} style={{ flex: '0 1 9rem' }}>
        <Select
          allowDeselect={false}
          data={[...sortDirectionOptions]}
          value={sortDirection}
          aria-label="Order"
          styles={queryControlStyles}
          onChange={onSortDirectionChange}
          {...getFieldProps(labelMode, 'Order')}
        />
      </Box>
    </>
  );
}
