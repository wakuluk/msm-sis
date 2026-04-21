import { Grid, TextInput } from '@mantine/core';
import type { ComponentProps } from 'react';

type ReadOnlyFieldProps = {
  label: string;
  value: string;
  span?: ComponentProps<typeof Grid.Col>['span'];
};

export function ReadOnlyField({
  label,
  value,
  span = { base: 12, md: 6 },
}: ReadOnlyFieldProps) {
  const isEmptyValue = value === '—';

  return (
    <Grid.Col span={span}>
      <TextInput
        label={label}
        value={isEmptyValue ? '' : value}
        placeholder={isEmptyValue ? '—' : undefined}
        readOnly
      />
    </Grid.Col>
  );
}
