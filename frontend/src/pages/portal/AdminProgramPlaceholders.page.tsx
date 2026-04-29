import { Badge, Button, List, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { RecordPageSection } from '@/components/create/RecordPageSection';
import { RecordPageShell } from '@/components/create/RecordPageShell';

type AdminProgramPlaceholderPageProps = {
  description: string;
  items: string[];
  sectionTitle: string;
  title: string;
};

function AdminProgramPlaceholderPage({
  description,
  items,
  sectionTitle,
  title,
}: AdminProgramPlaceholderPageProps) {
  return (
    <RecordPageShell
      eyebrow="Academic Administration"
      title={title}
      description={description}
      badge={
        <Badge variant="light" color="gray" size="lg">
          Placeholder
        </Badge>
      }
    >
      <RecordPageSection title={sectionTitle}>
        <List spacing="xs" size="sm">
          {items.map((item) => (
            <List.Item key={item}>{item}</List.Item>
          ))}
        </List>
        <Text size="sm" c="dimmed" mt="md">
          This page is a navigation placeholder while the program requirement workflows are being
          shaped.
        </Text>
      </RecordPageSection>
    </RecordPageShell>
  );
}

export function AcademicProgramsPage() {
  return (
    <RecordPageShell
      eyebrow="Academic Administration"
      title="Programs"
      description="Search, create, and manage academic programs that students can declare."
      badge={
        <Button component={Link} to="/academics/programs/new">
          Create Program
        </Button>
      }
    >
      <RecordPageSection title="Program Management">
        <List spacing="xs" size="sm">
          <List.Item>
            Search programs by name, code, school, department, degree type, and active status.
          </List.Item>
          <List.Item>
            Open a program workspace to manage overview details, requirements, students, and
            requests.
          </List.Item>
          <List.Item>
            Navigate here directly from Academics, or contextually from school and department pages.
          </List.Item>
        </List>
        <Text size="sm" c="dimmed" mt="md">
          This page is a navigation placeholder while the program search workflow is being shaped.
        </Text>
      </RecordPageSection>
    </RecordPageShell>
  );
}

export function AcademicProgramCreatePage() {
  return (
    <AdminProgramPlaceholderPage
      title="Create Program"
      description="Set up a new academic program before attaching reusable requirements."
      sectionTitle="New Program"
      items={[
        'Capture the program code, name, degree type, school, department, and active status.',
        'Save the program, then continue into the program workspace.',
        'Attach reusable requirements after the program record exists.',
      ]}
    />
  );
}

export function AcademicRequirementsPage() {
  return (
    <AdminProgramPlaceholderPage
      title="Requirement Library"
      description="Create and manage reusable requirements that can be attached to one or more programs."
      sectionTitle="Reusable Requirements"
      items={[
        'Search requirements by name, type, course, subject, credit rule, and active status.',
        'Create reusable requirements such as required courses, elective buckets, minimum credits, and GPA checks.',
        'Attach requirements to programs with class-year start and expiration years.',
      ]}
    />
  );
}

export function AcademicDegreeRequestsPage() {
  return (
    <AdminProgramPlaceholderPage
      title="Degree Requests"
      description="Review and approve student requests to declare or change academic programs."
      sectionTitle="Declaration Queue"
      items={[
        'Review pending program declaration requests submitted by students.',
        'Approve, deny, or route requests back for follow-up.',
        'Jump from a request into the student-specific program and degree tracking workflow.',
      ]}
    />
  );
}
