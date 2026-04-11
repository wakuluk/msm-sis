import { Group, Text } from '@mantine/core';
import { ResultsViewToggle } from './ResultsViewToggle';

type SearchResultsHeaderOption<T extends string> = {
  label: string;
  value: T;
};

type SearchResultsHeaderProps<T extends string> = {
  data: ReadonlyArray<SearchResultsHeaderOption<T>>;
  value: T;
  onChange: (value: T) => void;
  summary: string;
};

export function SearchResultsHeader<T extends string>({
  data,
  value,
  onChange,
  summary,
}: SearchResultsHeaderProps<T>) {
  return (
    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
      <Group align="center" wrap="wrap" gap="xs">
        <ResultsViewToggle data={data} value={value} onChange={onChange} />
      </Group>
      <Text size="sm">{summary}</Text>
    </Group>
  );
}
