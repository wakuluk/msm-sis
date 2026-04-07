import { Button, NavLink, ScrollArea, Stack } from '@mantine/core';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useActions, useAccessTokenData } from '@/auth/auth-store';
import { hasAnyPortalRole } from '@/portal/PortalRoles';
import {
  portalRoutes,
  type PortalRouteGroup,
  type PortalRouteGroupKey,
  type PortalRouteItem,
  type PortalRouteNode,
} from '@/portal/PortalRoutes';
import classes from './NavbarNested.module.css';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle/ColorSchemeToggle';

type NavbarNestedProps = {
  onNavigate?: () => void;
};

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

// Convert the full portal route tree into just the nodes this user should see.
function getVisibleNavRoutes(
  routes: readonly PortalRouteNode[],
  userRoles: readonly string[] | undefined
): PortalRouteNode[] {
  return routes.reduce<PortalRouteNode[]>((visibleRoutes, route) => {
    const nextRoutes =
      route.kind === 'item'
        ? getVisibleNavItem(route, userRoles)
        : getVisibleNavGroup(route, userRoles);

    visibleRoutes.push(...nextRoutes);
    return visibleRoutes;
  }, []);
}

// Plain nav items are either visible as-is or omitted entirely.
function getVisibleNavItem(
  route: PortalRouteItem,
  userRoles: readonly string[] | undefined
): PortalRouteNode[] {
  return shouldShowNavNode(route, userRoles) ? [route] : [];
}

// Groups are filtered by their children:
// no visible children means drop the group,
// one visible child means flatten it into a direct link,
// multiple visible children means keep the grouped nav section.
function getVisibleNavGroup(
  route: PortalRouteGroup,
  userRoles: readonly string[] | undefined
): PortalRouteNode[] {
  if (!route.showInNav) {
    return [];
  }

  const children = route.children.filter((child) => shouldShowNavNode(child, userRoles));

  if (!children.length) {
    return [];
  }

  if (children.length === 1) {
    return [children[0]];
  }

  return [{ ...route, children }];
}

// Shared visibility rule for route items that are controlled by nav visibility and roles.
function shouldShowNavNode(route: PortalRouteNode, userRoles: readonly string[] | undefined) {
  return route.showInNav && hasAnyPortalRole(userRoles, route.requiredRoles);
}

export function NavbarNested({ onNavigate }: NavbarNestedProps) {
  const actions = useActions();
  const tokenData = useAccessTokenData();
  const location = useLocation();
  const navigate = useNavigate();
  const [openedGroups, setOpenedGroups] = useState<Partial<Record<PortalRouteGroupKey, boolean>>>(
    {}
  );
  // Build the final nav tree from the shared portal route config and current user roles.
  const visibleNavRoutes = getVisibleNavRoutes(portalRoutes, tokenData?.roles);

  const handleLogout = () => {
    actions.clearTokens();
    navigate('/login', { replace: true });
  };

  // Render either a direct route link or a grouped nav section with nested children.
  const renderNavNode = (node: PortalRouteNode, nested = false) => {
    if (node.kind === 'item') {
      return (
        <NavLink
          key={node.key}
          component={Link}
          to={node.path}
          label={node.label}
          active={location.pathname === node.path}
          onClick={onNavigate}
          className={joinClasses(classes.navLink, nested && classes.groupChildLink)}
          classNames={{
            label: joinClasses(
              classes.navLabel,
              nested ? 'portal-ui-value-text' : 'portal-ui-nav-text'
            ),
          }}
        />
      );
    }

    const hasActiveChild = node.children.some((child) => location.pathname === child.path);
    const isOpened = openedGroups[node.key] ?? hasActiveChild;

    return (
      <NavLink
        key={node.key}
        label={node.label}
        active={hasActiveChild}
        opened={isOpened}
        onChange={(opened) => {
          setOpenedGroups((current) => ({
            ...current,
            [node.key]: opened,
          }));
        }}
        childrenOffset="md"
        className={classes.navLink}
        classNames={{
          children: classes.groupChildren,
          label: joinClasses(classes.navLabel, 'portal-ui-nav-text'),
        }}
      >
        {node.children.map((child) => renderNavNode(child, true))}
      </NavLink>
    );
  };

  return (
    <nav className={classes.navbar}>
      {/* Scrollable nav links generated from portal route config */}
      <ScrollArea className={classes.links} scrollbars="y" offsetScrollbars="y">
        <Stack gap="xs" className={classes.linksInner}>
          {visibleNavRoutes.map((node) => renderNavNode(node))}
        </Stack>
      </ScrollArea>
      {/* Footer actions that stay pinned at the bottom */}
      <div className={classes.footer}>
        <Stack gap="xs">
          <ColorSchemeToggle />
          <Button onClick={handleLogout} fullWidth>
            Logout
          </Button>
        </Stack>
      </div>
    </nav>
  );
}
