import type { ReactNode } from 'react';
import { Fieldset, Grid } from '@mantine/core';

type SearchFormSectionProps = {
  legend: string;
  children: ReactNode;
};

export function SearchFormSection({ legend, children }: SearchFormSectionProps) {
  return (
    <Fieldset legend={legend} radius="sm">
      <Grid gap="md" mt="xs">
        {children}
      </Grid>
    </Fieldset>
  );
}
