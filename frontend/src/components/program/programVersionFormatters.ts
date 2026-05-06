import type {
  ProgramVersionCompletionRequirementResponse,
  ProgramVersionDetailResponse,
} from '@/services/schemas/program-schemas';

export function formatClassYearRange(version: ProgramVersionDetailResponse) {
  if (version.classYearEnd === null) {
    return `${version.classYearStart}+`;
  }

  return `${version.classYearStart}-${version.classYearEnd}`;
}

export function formatCompletionRequirementOption(
  option: ProgramVersionCompletionRequirementResponse['options'][number]
) {
  if (option.requiredProgramTypeName !== null) {
    return `Any ${option.requiredProgramTypeName.toLowerCase()}`;
  }

  if (option.requiredProgramName !== null) {
    return option.requiredProgramCode === null
      ? option.requiredProgramName
      : `${option.requiredProgramName} (${option.requiredProgramCode})`;
  }

  if (option.requiredProgramVersionId !== null) {
    const programName = option.requiredProgramVersionProgramName ?? 'Program';
    const versionNumber = option.requiredProgramVersionNumber ?? option.requiredProgramVersionId;
    return `${programName} version ${versionNumber}`;
  }

  return '—';
}

export function formatCompletionRequirementSummary(
  requirement: ProgramVersionCompletionRequirementResponse
) {
  const options = requirement.options.map(formatCompletionRequirementOption);
  if (options.length === 0) {
    return 'No options configured';
  }

  return `Requires ${requirement.minimumCount} of: ${options.join(', ')}`;
}
