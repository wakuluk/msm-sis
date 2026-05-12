import type { ComboboxItem } from '@mantine/core';

export const registrationGroupStatusFilterOptions: ComboboxItem[] = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'CLOSED', label: 'Closed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function normalizeRegistrationGroupStatus(statusCode: string | null | undefined) {
  switch (statusCode) {
    case 'PUBLISHED':
      return 'PUBLISHED';
    case 'CLOSED':
      return 'CLOSED';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'DRAFT':
      return 'DRAFT';
    default:
      return statusCode ?? null;
  }
}

export function getRegistrationGroupStatusLabel(
  statusCode: string | null | undefined,
  statusName?: string | null
) {
  switch (normalizeRegistrationGroupStatus(statusCode)) {
    case 'DRAFT':
      return 'Draft';
    case 'PUBLISHED':
      return 'Published';
    case 'CLOSED':
      return 'Closed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return statusName?.trim() || statusCode || '-';
  }
}

export function getRegistrationGroupStatusColor(statusCode: string | null | undefined) {
  switch (normalizeRegistrationGroupStatus(statusCode)) {
    case 'PUBLISHED':
      return 'green';
    case 'CLOSED':
      return 'gray';
    case 'CANCELLED':
      return 'red';
    case 'DRAFT':
    default:
      return 'yellow';
  }
}
