import { Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

type ForbiddenPageProps = {
  requiredRole: string;
};

export function ForbiddenPage({ requiredRole }: ForbiddenPageProps) {
  return (
    <Container size={420} my={40}>
      <Title ta="center">403</Title>
      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            You do not have permission to access this page.
          </Text>
          <Group justify="space-between">
            <Button variant="default" component={Link} to="/portal">
              Back to portal
            </Button>
            <Button variant="light" component={Link} to="/public">
              Public page
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
