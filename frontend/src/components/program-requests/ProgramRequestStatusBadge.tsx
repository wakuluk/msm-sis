import { Badge } from '@mantine/core';

type ProgramRequestStatusBadgeProps = {
  status: string;
};

const statusDisplay: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: 'green', label: 'Active' },
  ADMIN_APPROVED: { color: 'green', label: 'Admin approved' },
  DEPARTMENT_APPROVED: { color: 'blue', label: 'Department approved' },
  REJECTED: { color: 'red', label: 'Rejected' },
  REQUESTED: { color: 'yellow', label: 'Requested' },
};

export function ProgramRequestStatusBadge({ status }: ProgramRequestStatusBadgeProps) {
  const normalizedStatus = status.trim().toUpperCase();
  const display = statusDisplay[normalizedStatus] ?? {
    color: 'gray',
    label: normalizedStatus.replaceAll('_', ' ').toLowerCase(),
  };

  return (
    <Badge variant="light" color={display.color}>
      {display.label}
    </Badge>
  );
}
