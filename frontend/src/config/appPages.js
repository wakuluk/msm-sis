import { ROLES } from "./roles";

export const APP_PAGES = Object.freeze({
  HOME: {
    path: "/",
    label: "Home",
    nav_header: "General",
  },
  FORBIDDEN: {
    path: "/forbidden",
    label: "Forbidden",
    showInNavigation: false,
  },
  STUDENT_PROFILE: {
    path: "/students/profile",
    label: "My Profile",
    nav_header: "Your Info",
    roles: [ROLES.STUDENT],
  },
  STUDENTS: {
    path: "/students",
    label: "Students",
    nav_header: "Students",
    roles: [ROLES.ADMIN, ROLES.STUDENT],
  },
  STUDENT_ID_SEARCH: {
    path: "/students/id",
    label: "Student ID Search",
    nav_header: "Students",
    roles: [ROLES.STUDENT],
  },
  STUDENT_CREATE: {
    path: "/students/new",
    label: "Create Student",
    nav_header: "Students",
    roles: [ROLES.ADMIN],
  }
});

export const appPages = Object.values(APP_PAGES);

export function canAccessAppPage(page, userRoles = []) {
  if (!page?.roles?.length) {
    return true;
  }

  return page.roles.some((role) => userRoles.includes(role));
}

export function getAccessibleNavigationPages(userRoles = []) {
  return appPages.filter((page) => (
    page.showInNavigation !== false
    && canAccessAppPage(page, userRoles)
  ));
}

export function getAccessibleNavigationGroups(userRoles = []) {
  const groupsByHeader = new Map();
  const orderedGroups = [];

  getAccessibleNavigationPages(userRoles).forEach((page) => {
    const header = page.nav_header ?? "Navigation";

    if (!groupsByHeader.has(header)) {
      const group = {
        header,
        pages: [],
      };

      groupsByHeader.set(header, group);
      orderedGroups.push(group);
    }

    groupsByHeader.get(header).pages.push(page);
  });

  return orderedGroups;
}

export function getDefaultAppPage(userRoles = []) {
  const normalizedRoles = Array.isArray(userRoles) ? userRoles : [];

  if (normalizedRoles.includes(ROLES.STUDENT) && !normalizedRoles.includes(ROLES.ADMIN)) {
    return APP_PAGES.STUDENT_PROFILE;
  }

  return APP_PAGES.HOME;
}
