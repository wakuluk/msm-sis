import { Container } from '@mantine/core';
import { ProgramSearchExperience } from '@/components/program/ProgramSearchExperience';
import { searchPrograms } from '@/services/program-service';

export function ProgramSearchPage() {
  return (
    <Container size="xl" py="xl">
      <ProgramSearchExperience
        canCreateProgram
        loadPrograms={searchPrograms}
        title="Program Search"
      />
    </Container>
  );
}
