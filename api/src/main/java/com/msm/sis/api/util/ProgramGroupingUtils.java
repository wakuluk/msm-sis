package com.msm.sis.api.util;

import com.msm.sis.api.entity.Program;
import com.msm.sis.api.entity.ProgramVersion;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public final class ProgramGroupingUtils {
    private ProgramGroupingUtils() {
    }

    public static List<Long> collectProgramIds(List<Program> programs) {
        return programs.stream()
                .map(Program::getId)
                .filter(Objects::nonNull)
                .toList();
    }

    public static Map<Long, ProgramVersion> indexFirstVersionByProgramId(List<ProgramVersion> programVersions) {
        Map<Long, ProgramVersion> versionsByProgramId = new LinkedHashMap<>();
        programVersions.forEach(programVersion -> {
            Long programId = getProgramId(programVersion);
            if (programId == null) {
                return;
            }

            versionsByProgramId.putIfAbsent(programId, programVersion);
        });

        return versionsByProgramId;
    }

    private static Long getProgramId(ProgramVersion programVersion) {
        if (programVersion.getProgram() == null) {
            return null;
        }

        return programVersion.getProgram().getId();
    }
}
