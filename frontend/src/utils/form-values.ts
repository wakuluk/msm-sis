export function displayValue(value: boolean | number | string | null | undefined): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}

export function trimToNull(value: string): string | null {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

export function numberToNull(value: number | string): number | null {
  if (value === '') {
    return null;
  }

  const numericValue = Number(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

export function integerToNull(value: number | string): number | null {
  const numericValue = numberToNull(value);

  return numericValue === null ? null : Math.trunc(numericValue);
}

export function parseOptionalId(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const numericValue = Number(value);

  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined;
}
