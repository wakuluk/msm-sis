import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type {
  ProgramDetailResponse,
  ProgramVersionDetailResponse,
} from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';
import { formatClassYearRange } from './programVersionFormatters';

export function ProgramVersionSummarySection({
  currentVersion,
  program,
}: {
  currentVersion: ProgramVersionDetailResponse | null;
  program: ProgramDetailResponse;
}) {
  return (
    <RecordPageSection
      title="Version Summary"
      description="The current published version is based on the open-ended year range."
    >
      <ReadOnlyField
        label="Current published version"
        value={currentVersion ? `Version ${currentVersion.versionNumber}` : '—'}
      />
      <ReadOnlyField
        label="Current years"
        value={currentVersion ? formatClassYearRange(currentVersion) : '—'}
      />
      <ReadOnlyField label="Total versions" value={displayValue(program.versions.length)} />
      <ReadOnlyField
        label="Published versions"
        value={displayValue(program.versions.filter((version) => version.published).length)}
      />
    </RecordPageSection>
  );
}
