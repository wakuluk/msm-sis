import type { ReactNode } from 'react';
import { Button, Group } from '@mantine/core';
import {
  SearchQueryControls,
  type SearchQueryControlWidths,
  type StringOption,
} from '@/components/search/SearchQueryControls';

type SearchFormActionsProps<TSortBy extends string, TSortDirection extends string> = {
  leadingContent?: ReactNode;
  trailingContent?: ReactNode;
  size?: string;
  sortBy?: TSortBy;
  sortDirection?: TSortDirection;
  sizeOptions?: ReadonlyArray<StringOption>;
  sortByOptions?: ReadonlyArray<StringOption<TSortBy>>;
  sortDirectionOptions?: ReadonlyArray<StringOption<TSortDirection>>;
  onSizeChange?: (value: string | null) => void;
  onSortByChange?: (value: string | null) => void;
  onSortDirectionChange?: (value: string | null) => void;
  queryControlLabelMode?: 'label' | 'placeholder';
  queryControlWidths?: SearchQueryControlWidths;
  showQueryControls?: boolean;
  showButtons?: boolean;
  clearLabel?: string;
  submitLabel?: string;
  clearDisabled?: boolean;
  isSubmitting?: boolean;
  onClear?: () => void;
  align?: 'center' | 'flex-end';
  containerClassName?: string;
  actionsClassName?: string;
  clearButtonClassName?: string;
  submitButtonClassName?: string;
};

export function SearchFormActions<TSortBy extends string, TSortDirection extends string>({
  leadingContent,
  trailingContent,
  size,
  sortBy,
  sortDirection,
  sizeOptions,
  sortByOptions,
  sortDirectionOptions,
  onSizeChange,
  onSortByChange,
  onSortDirectionChange,
  queryControlLabelMode = 'label',
  queryControlWidths,
  showQueryControls = true,
  showButtons = true,
  clearLabel = 'Clear',
  submitLabel = 'Search',
  clearDisabled = false,
  isSubmitting = false,
  onClear,
  align = 'flex-end',
  containerClassName,
  actionsClassName,
  clearButtonClassName,
  submitButtonClassName,
}: SearchFormActionsProps<TSortBy, TSortDirection>) {
  const shouldRenderQueryControls =
    showQueryControls &&
    size !== undefined &&
    sortBy !== undefined &&
    sortDirection !== undefined &&
    sizeOptions !== undefined &&
    sortByOptions !== undefined &&
    sortDirectionOptions !== undefined &&
    onSizeChange !== undefined &&
    onSortByChange !== undefined &&
    onSortDirectionChange !== undefined;
  const shouldRenderButtons = showButtons && onClear !== undefined;

  return (
    <Group
      justify={leadingContent ? 'space-between' : 'flex-end'}
      align={align}
      gap="md"
      wrap="wrap"
      className={containerClassName}
    >
      {leadingContent}

      {(shouldRenderQueryControls || shouldRenderButtons || trailingContent) && (
        <Group align="flex-end" gap="md" wrap="wrap">
          {(shouldRenderQueryControls || shouldRenderButtons) && (
            <Group align="flex-end" gap="md" wrap="wrap" className={actionsClassName}>
              {shouldRenderQueryControls ? (
                <SearchQueryControls
                  size={size}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  sizeOptions={sizeOptions}
                  sortByOptions={sortByOptions}
                  sortDirectionOptions={sortDirectionOptions}
                  onSizeChange={onSizeChange}
                  onSortByChange={onSortByChange}
                  onSortDirectionChange={onSortDirectionChange}
                  labelMode={queryControlLabelMode}
                  widths={queryControlWidths}
                />
              ) : null}

              {shouldRenderButtons ? (
                <>
                  <Button
                    type="button"
                    variant="default"
                    onClick={onClear}
                    disabled={clearDisabled}
                    className={clearButtonClassName}
                  >
                    {clearLabel}
                  </Button>
                  <Button type="submit" loading={isSubmitting} className={submitButtonClassName}>
                    {submitLabel}
                  </Button>
                </>
              ) : null}
            </Group>
          )}

          {trailingContent}
        </Group>
      )}
    </Group>
  );
}
