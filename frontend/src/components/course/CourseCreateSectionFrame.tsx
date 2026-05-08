import { Grid, Stack, Text, Title } from '@mantine/core';

type CourseCreateSectionFrameProps = {
  children: React.ReactNode;
  description: string;
  title: string;
};

export function CourseCreateSectionFrame({
  children,
  description,
  title,
}: CourseCreateSectionFrameProps) {
  return (
    <Stack gap="md">
      <Stack gap={3}>
        <Title order={3} size="h4">
          {title}
        </Title>
        <Text size="sm" c="dimmed">
          {description}
        </Text>
      </Stack>
      <Grid gap="md">{children}</Grid>
    </Stack>
  );
}
