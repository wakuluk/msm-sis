import type { ComponentProps, ReactNode } from 'react';
import { Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import classes from './RecordPageLayout.module.css';

type RecordPageShellProps = {
  badge?: ReactNode;
  beforeForm?: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  size?: ComponentProps<typeof Container>['size'];
  title: ReactNode;
};

export function RecordPageShell({
  badge,
  beforeForm,
  children,
  description,
  eyebrow,
  size = 'xl',
  title,
}: RecordPageShellProps) {
  return (
    <Container size={size} py="lg">
      <Stack className={classes.page}>
        <Paper className={classes.summaryCard}>
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="lg">
            <Stack gap="xs" className={classes.summaryCopy}>
              {eyebrow ? <Text className="portal-ui-eyebrow-text">{eyebrow}</Text> : null}
              <Title order={1} className={classes.summaryTitle}>
                {title}
              </Title>
              {description ? (
                <Text size="sm" c="dimmed" className={classes.summaryText}>
                  {description}
                </Text>
              ) : null}
            </Stack>
            {badge}
          </Group>
        </Paper>

        {beforeForm}

        <Paper className={classes.formPanel}>{children}</Paper>
      </Stack>
    </Container>
  );
}
