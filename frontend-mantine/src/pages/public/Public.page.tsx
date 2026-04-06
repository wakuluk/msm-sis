import { Button, Group, Stack, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { ColorSchemeToggle } from '../../components/ColorSchemeToggle/ColorSchemeToggle';
import { Welcome } from '../../components/Welcome/Welcome';

export function PublicPage() {
  return (
    <Stack gap="lg">
      <Welcome />
        <Group justify="center">
            <Button component={Link} to="/login" size="md" radius="xl">
                Open Login Page
            </Button>
        </Group>
      <ColorSchemeToggle />
    </Stack>
  );
}
