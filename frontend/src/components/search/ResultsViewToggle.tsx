import { SegmentedControl } from '@mantine/core';
import classes from './ResultsViewToggle.module.css';

type ResultsViewToggleOption<T extends string> = {
  label: string;
  value: T;
};

type ResultsViewToggleProps<T extends string> = {
  data: ReadonlyArray<ResultsViewToggleOption<T>>;
  value: T;
  onChange: (value: T) => void;
};

export function ResultsViewToggle<T extends string>({
  data,
  value,
  onChange,
}: ResultsViewToggleProps<T>) {
  return (
    <SegmentedControl
      classNames={{
        root: classes.resultsViewToggle,
        indicator: classes.resultsViewToggleIndicator,
        label: classes.resultsViewToggleLabel,
      }}
      data={[...data]}
      value={value}
      onChange={(nextValue) => {
        onChange(nextValue as T);
      }}
    />
  );
}
