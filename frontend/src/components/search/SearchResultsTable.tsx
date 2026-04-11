import { Fragment, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { flexRender, type Row, type Table as TanstackTable } from '@tanstack/react-table';
import { Table, UnstyledButton } from '@mantine/core';
import classes from './SearchResultsTable.module.css';

type SortDirection = 'asc' | 'desc';

type SortableColumnMeta<TSortBy extends string> = {
  sortBy?: TSortBy;
};

export type SearchResultsTableRowProps = Pick<
  ComponentPropsWithoutRef<'tr'>,
  'aria-expanded' | 'className' | 'onClick' | 'onKeyDown' | 'role' | 'tabIndex'
>;

type SearchResultsTableProps<TRow, TSortBy extends string> = {
  table: TanstackTable<TRow>;
  sortBy: TSortBy;
  sortDirection: SortDirection;
  onToggleSort: (sortBy: TSortBy) => void;
  getRowProps?: (row: Row<TRow>) => SearchResultsTableRowProps | undefined;
  renderExpandedRow?: (row: Row<TRow>) => ReactNode;
};

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

function getSortIndicator<TSortBy extends string>(
  activeSortBy: TSortBy,
  activeSortDirection: SortDirection,
  columnSortBy: TSortBy
) {
  if (activeSortBy !== columnSortBy) {
    return null;
  }

  return activeSortDirection === 'asc' ? '↑' : '↓';
}

export function SearchResultsTable<TRow, TSortBy extends string>({
  table,
  sortBy,
  sortDirection,
  onToggleSort,
  getRowProps,
  renderExpandedRow,
}: SearchResultsTableProps<TRow, TSortBy>) {
  return (
    <div className={classes.resultsTableWrapper}>
      <Table
        className={classes.resultsTable}
        style={{ minWidth: `${table.getTotalSize()}px` }}
        horizontalSpacing="md"
        verticalSpacing="sm"
      >
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.Th key={header.id} style={{ width: `${header.getSize()}px` }}>
                  {header.isPlaceholder
                    ? null
                    : (() => {
                        const columnMeta = header.column.columnDef.meta as
                          | SortableColumnMeta<TSortBy>
                          | undefined;
                        const columnSortBy = columnMeta?.sortBy;
                        const sortIndicator = columnSortBy
                          ? getSortIndicator(sortBy, sortDirection, columnSortBy)
                          : null;

                        if (!columnSortBy) {
                          return flexRender(header.column.columnDef.header, header.getContext());
                        }

                        return (
                          <UnstyledButton
                            className={classes.sortButton}
                            onClick={() => {
                              onToggleSort(columnSortBy);
                            }}
                          >
                            <span>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                            <span
                              className={
                                sortIndicator
                                  ? `${classes.sortDirection} ${classes.sortDirectionActive}`
                                  : classes.sortDirection
                              }
                            >
                              {sortIndicator ?? '↕'}
                            </span>
                          </UnstyledButton>
                        );
                      })()}
                </Table.Th>
              ))}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {table.getRowModel().rows.map((row) => {
            const rowProps = getRowProps?.(row);

            return (
              <Fragment key={row.id}>
                <Table.Tr
                  {...rowProps}
                  className={joinClasses(
                    rowProps ? classes.clickableRow : undefined,
                    rowProps?.className
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id} style={{ width: `${cell.column.getSize()}px` }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </Table.Td>
                  ))}
                </Table.Tr>
                {renderExpandedRow?.(row)}
              </Fragment>
            );
          })}
        </Table.Tbody>
      </Table>
    </div>
  );
}
