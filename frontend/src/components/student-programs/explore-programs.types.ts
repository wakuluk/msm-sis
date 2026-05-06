import type {
  ProgramSearchResponse,
  ProgramSearchResultResponse,
} from '@/services/schemas/program-schemas';

export type ProgramExploreFilters = {
  programTypeId: string;
  degreeTypeId: string;
  schoolId: string;
  departmentId: string;
  code: string;
  name: string;
};

export type ProgramExploreCatalogOption = {
  code: string;
  label: string;
  value: string;
};

export type ProgramExploreDepartmentOption = {
  label: string;
  schoolId: number;
  value: string;
};

export type ProgramExploreReferenceState =
  | { status: 'idle' | 'loading' }
  | {
      status: 'success';
      programTypeOptions: ProgramExploreCatalogOption[];
      degreeTypeOptions: ProgramExploreCatalogOption[];
      schoolOptions: ProgramExploreCatalogOption[];
      departmentOptions: ProgramExploreDepartmentOption[];
    }
  | { status: 'error'; message: string };

export type ProgramExploreResultsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; response: ProgramSearchResponse }
  | { status: 'success'; response: ProgramSearchResponse };

export type ProgramExploreSize = '10' | '25' | '50';

export type SelectedExploreProgram = ProgramSearchResultResponse | null;
