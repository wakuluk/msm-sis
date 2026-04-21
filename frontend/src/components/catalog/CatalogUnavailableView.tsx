import { Alert, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAccessTokenData } from '@/auth/auth-store';
import { hasPortalRole, PORTAL_ROLES } from '@/portal/PortalRoles';

type CatalogUnavailableViewProps = {
  title: string;
};

export function CatalogUnavailableView({ title }: CatalogUnavailableViewProps) {
  const tokenData = useAccessTokenData();
  const canOpenAcademicYears = hasPortalRole(tokenData?.roles, PORTAL_ROLES.ADMIN);

  return (
    <Container size="md" py="xl">
      <Paper withBorder radius="lg" p="xl">
        <Stack gap="lg">
          <div>
            <Title order={1}>{title}</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Catalog search is temporarily unavailable while academic year and term status are
              being redesigned.
            </Text>
          </div>

          <Alert color="orange" title="Catalog search disabled">
            The frontend catalog search screens and the backend catalog search endpoints are
            intentionally disabled for now.
          </Alert>

          <Text size="sm">
            Once the new academic year status and term status model is in place, the catalog search
            flow can be rebuilt against that contract.
          </Text>

          <Group gap="sm" wrap="wrap">
            <Button component={Link} to="/portal" variant="default">
              Back to portal
            </Button>
            {canOpenAcademicYears ? (
              <Button component={Link} to="/academics/academic-years/search" variant="light">
                Academic years
              </Button>
            ) : null}
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}
