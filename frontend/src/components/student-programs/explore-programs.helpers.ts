import type {
  AcademicDepartmentReferenceOption,
  CatalogReferenceOption,
} from '@/services/schemas/reference-schemas';
import type {
  ProgramExploreCatalogOption,
  ProgramExploreDepartmentOption,
  ProgramExploreResultsState,
} from './explore-programs.types';

export function mapExploreCatalogOption(
  option: CatalogReferenceOption
): ProgramExploreCatalogOption {
  return {
    code: option.code,
    value: String(option.id),
    label: `${option.name} (${option.code})`,
  };
}

export function mapExploreDepartmentOption(
  department: AcademicDepartmentReferenceOption
): ProgramExploreDepartmentOption {
  return {
    value: String(department.id),
    label: `${department.name} (${department.code})`,
    schoolId: department.schoolId,
  };
}

export function isNonDegreeProgramType(option: ProgramExploreCatalogOption | undefined) {
  return option?.code === 'MINOR' || option?.code === 'CERTIFICATE';
}

export function getProgramTypeBadgeColor(programTypeCode: string | null) {
  if (programTypeCode === 'MAJOR') {
    return 'blue';
  }

  if (programTypeCode === 'MINOR') {
    return 'grape';
  }

  if (programTypeCode === 'CERTIFICATE') {
    return 'teal';
  }

  return 'gray';
}

export function getExploreResultsSummary(state: ProgramExploreResultsState): string {
  if (state.status === 'loading') {
    return 'Loading program search results...';
  }

  if (state.status === 'error') {
    return 'Program search failed.';
  }

  if (state.status === 'success' || state.status === 'empty') {
    if (state.response.totalElements === 0 || state.response.results.length === 0) {
      return 'No programs matched the current search criteria.';
    }

    const start = state.response.page * state.response.size + 1;
    const end = state.response.page * state.response.size + state.response.results.length;

    return `Showing ${start}-${end} of ${state.response.totalElements} programs`;
  }

  return 'Program exploration is ready.';
}
