import type { ReactNode } from 'react';
import { Group, Text } from '@mantine/core';
import classes from './RecordPageLayout.module.css';

type RecordPageFooterProps = {
  children: ReactNode;
  description?: ReactNode;
};

export function RecordPageFooter({ children, description }: RecordPageFooterProps) {
  return (
    <div className={classes.footerBar}>
      {description ? (
        <Text size="sm" c="dimmed" className={classes.footerText}>
          {description}
        </Text>
      ) : (
        <div />
      )}
      <Group gap="sm" wrap="wrap" justify="flex-end">
        {children}
      </Group>
    </div>
  );
}
