import { ROLES } from "./roles";

export const navigationItems = [
  { to: "/", label: "Home" },
  {
    to: "/students",
    label: "Students",
    quickActionLabel: "Search Students",
    showInQuickActions: true,
    roles: [ROLES.ADMIN],
  },
  {
    to: "/students/id",
    label: "Student ID Search",
    roles: [ROLES.STUDENT],
  },
  {
    to: "/students/new",
    label: "Create Student",
    showInQuickActions: true,
    roles: [ROLES.ADMIN],
  },
  {
    to: "/pdfs",
    label: "Documents",
    quickActionLabel: "View Documents",
    showInQuickActions: true,
    roles: [ROLES.ADMIN],
  },
  {
    to: "/pdfs/new",
    label: "Upload PDF",
    showInQuickActions: true,
    roles: [ROLES.ADMIN],
  },
];

export function canAccessNavigationItem(item, userRoles = []) {
  if (!item.roles?.length) {
    return true;
  }

  return item.roles.some((role) => userRoles.includes(role));
}

export function getAccessibleNavigationItems(userRoles = []) {
  return navigationItems.filter((item) => canAccessNavigationItem(item, userRoles));
}
