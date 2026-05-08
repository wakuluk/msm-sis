import { RecordPageSection } from '@/components/create/RecordPageSection';
import { ReadOnlyField } from '@/components/fields/ReadOnlyField';
import type { ProgramDetailResponse } from '@/services/schemas/program-schemas';
import { displayValue } from '@/utils/form-values';

export function ProgramInfoSection({ program }: { program: ProgramDetailResponse }) {
  return (
    <RecordPageSection title="Program" description="Core program information.">
      <ReadOnlyField label="Code" value={displayValue(program.code)} />
      <ReadOnlyField label="Name" value={displayValue(program.name)} />
      <ReadOnlyField label="Program type" value={displayValue(program.programTypeName)} />
      <ReadOnlyField label="Degree type" value={displayValue(program.degreeTypeName)} />
      <ReadOnlyField
        label="School"
        value={displayValue(
          program.schoolName && program.schoolCode
            ? `${program.schoolName} (${program.schoolCode})`
            : program.schoolName
        )}
      />
      <ReadOnlyField
        label="Department"
        value={displayValue(
          program.departmentName && program.departmentCode
            ? `${program.departmentName} (${program.departmentCode})`
            : program.departmentName
        )}
      />
      <ReadOnlyField label="Description" value={displayValue(program.description)} span={12} />
    </RecordPageSection>
  );
}
