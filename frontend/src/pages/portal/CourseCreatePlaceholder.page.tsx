import { Navigate } from 'react-router-dom';

export function CourseCreatePlaceholderPage() {
  return <Navigate to="/academics/courses/search" replace />;
}
