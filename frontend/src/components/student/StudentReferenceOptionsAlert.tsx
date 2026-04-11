import type { ReactNode } from 'react';
import { Alert } from '@mantine/core';

type StudentReferenceOptionsAlertProps = {
  children: ReactNode;
};

export function StudentReferenceOptionsAlert({ children }: StudentReferenceOptionsAlertProps) {
  return (
    <Alert color="orange" title="Reference options unavailable">
      {children}
    </Alert>
  );
}
