import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { NavbarNested } from '@/components/Navbar/NavbarNested';

export function PortalLayout() {
  const [opened, { toggle, close }] = useDisclosure(true);
  const isSmallScreen = useMediaQuery('(max-width: 48em)');

  useEffect(() => {
    if (isSmallScreen) {
      close();
    }
  }, [isSmallScreen, close]);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: {
          mobile: !opened,
          desktop: !opened,
        },
      }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} size="sm" />
            <Text fw={600}>Mount St. Mary's University</Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={0}>
        <NavbarNested />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
