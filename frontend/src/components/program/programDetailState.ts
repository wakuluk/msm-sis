import type {
  ProgramDetailResponse,
  ProgramVersionCompletionRequirementResponse,
  ProgramVersionRequirementResponse,
} from '@/services/schemas/program-schemas';

export function addRequirementAssignmentToProgram(
  program: ProgramDetailResponse,
  programVersionId: number,
  assignment: ProgramVersionRequirementResponse
): ProgramDetailResponse {
  return {
    ...program,
    versions: program.versions.map((version) => {
      if (version.programVersionId !== programVersionId) {
        return version;
      }

      return {
        ...version,
        requirements: [...version.requirements, assignment].sort(compareSortOrder),
      };
    }),
  };
}

export function updateRequirementAssignmentInProgram(
  program: ProgramDetailResponse,
  updatedAssignment: ProgramVersionRequirementResponse
): ProgramDetailResponse {
  return {
    ...program,
    versions: program.versions.map((version) => ({
      ...version,
      requirements: version.requirements
        .map((requirement) =>
          requirement.programVersionRequirementId === updatedAssignment.programVersionRequirementId
            ? updatedAssignment
            : requirement
        )
        .sort(compareSortOrder),
    })),
  };
}

export function removeRequirementAssignmentFromProgram(
  program: ProgramDetailResponse,
  programVersionRequirementId: number
): ProgramDetailResponse {
  return {
    ...program,
    versions: program.versions.map((version) => ({
      ...version,
      requirements: version.requirements.filter(
        (requirement) => requirement.programVersionRequirementId !== programVersionRequirementId
      ),
    })),
  };
}

export function addCompletionRequirementToProgram(
  program: ProgramDetailResponse,
  programVersionId: number,
  completionRequirement: ProgramVersionCompletionRequirementResponse
): ProgramDetailResponse {
  return {
    ...program,
    versions: program.versions.map((version) =>
      version.programVersionId === programVersionId
        ? {
            ...version,
            completionRequirements: [
              ...version.completionRequirements,
              completionRequirement,
            ].sort(compareSortOrder),
          }
        : version
    ),
  };
}

export function updateCompletionRequirementInProgram(
  program: ProgramDetailResponse,
  updatedCompletionRequirement: ProgramVersionCompletionRequirementResponse
): ProgramDetailResponse {
  return {
    ...program,
    versions: program.versions.map((version) => ({
      ...version,
      completionRequirements: version.completionRequirements
        .map((completionRequirement) =>
          completionRequirement.programVersionCompletionRequirementId ===
          updatedCompletionRequirement.programVersionCompletionRequirementId
            ? updatedCompletionRequirement
            : completionRequirement
        )
        .sort(compareSortOrder),
    })),
  };
}

export function removeCompletionRequirementFromProgram(
  program: ProgramDetailResponse,
  programVersionCompletionRequirementId: number
): ProgramDetailResponse {
  return {
    ...program,
    versions: program.versions.map((version) => ({
      ...version,
      completionRequirements: version.completionRequirements.filter(
        (completionRequirement) =>
          completionRequirement.programVersionCompletionRequirementId !==
          programVersionCompletionRequirementId
      ),
    })),
  };
}

function compareSortOrder(first: { sortOrder: number }, second: { sortOrder: number }) {
  return first.sortOrder - second.sortOrder;
}
