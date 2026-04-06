import { Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useActions, useAccessTokenData } from '@/auth/auth-store';

export function ProtectedPage() {
  const actions = useActions();
  const tokenData = useAccessTokenData();
  const navigate = useNavigate();

  const handleLogout = () => {
    actions.clearTokens();
    navigate('/login', { replace: true });
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Protected Page</Title>
      <Paper withBorder shadow="sm" p={22} mt={30} radius="md">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            This route requires authentication.
          </Text>
          <Text size="sm">
            Current roles: {tokenData?.roles.join(', ') ?? 'none'}
          </Text>
          <Group justify="space-between">
            <Button variant="default" component={Link} to="/">
              Public home
            </Button>
            <Button color="red" onClick={handleLogout}>
              Logout
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
