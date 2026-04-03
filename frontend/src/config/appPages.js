import { ROLES } from "./roles";

export const APP_PAGES = Object.freeze({
  HOME: {
    path: "/",
    label: "Home",
  },
  FORBIDDEN: {
    path: "/forbidden",
    label: "Forbidden",
    showInNavigation: false,
  },
  STUDENTS: {
    path: "/students",
    label: "Students",
    roles: [ROLES.ADMIN, ROLES.STUDENT],
  },
  STUDENT_ID_SEARCH: {
    path: "/students/id",
    label: "Student ID Search",
    roles: [ROLES.STUDENT],
  },
  STUDENT_CREATE: {
    path: "/students/new",
    label: "Create Student",
    roles: [ROLES.ADMIN],
  },
  PDFS: {
    path: "/pdfs",
    label: "Documents",
    roles: [ROLES.ADMIN],
  },
  PDF_UPLOAD: {
    path: "/pdfs/new",
    label: "Upload PDF",
    roles: [ROLES.ADMIN],
  },
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
