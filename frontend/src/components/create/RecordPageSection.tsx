import type { ReactNode } from 'react';
import { Grid, Group, Stack, Text, Title } from '@mantine/core';
import classes from './RecordPageLayout.module.css';

type RecordPageSectionProps = {
  action?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
};

export function RecordPageSection({
  action,
  children,
  description,
  title,
}: RecordPageSectionProps) {
  return (
    <section className={classes.section}>
      <div className={classes.sectionHeader}>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
          <Stack gap={4}>
            <Title order={3} className={classes.sectionTitle}>
              {title}
            </Title>
            {description ? (
              <Text size="sm" c="dimmed">
                {description}
              </Text>
            ) : null}
          </Stack>
          {action}
        </Group>
      </div>
      <Grid gap="md">{children}</Grid>
    </section>
  );
}
