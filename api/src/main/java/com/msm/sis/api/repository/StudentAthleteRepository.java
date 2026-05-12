package com.msm.sis.api.repository;

import com.msm.sis.api.entity.StudentAthlete;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StudentAthleteRepository extends JpaRepository<StudentAthlete, Long> {

    @EntityGraph(attributePaths = {"student", "athleticSport", "updatedByUser"})
    @Query("""
            select athlete
            from StudentAthlete athlete
            where athlete.student.id = :studentId
            order by athlete.athleticSport.name asc,
                     athlete.id asc
            """)
    List<StudentAthlete> findAllForStudent(@Param("studentId") Long studentId);

    @EntityGraph(attributePaths = {"student", "athleticSport", "updatedByUser"})
    @Query("""
            select athlete
            from StudentAthlete athlete
            where athlete.student.id = :studentId
              and athlete.athleticSport.id = :athleticSportId
            """)
    Optional<StudentAthlete> findForStudentAndSport(
            @Param("studentId") Long studentId,
            @Param("athleticSportId") Long athleticSportId
    );

    @EntityGraph(attributePaths = {"student", "athleticSport", "updatedByUser"})
    @Query("""
            select athlete
            from StudentAthlete athlete
            where athlete.student.id = :studentId
              and athlete.id = :studentAthleteId
            """)
    Optional<StudentAthlete> findForStudentAndId(
            @Param("studentId") Long studentId,
            @Param("studentAthleteId") Long studentAthleteId
    );

    @EntityGraph(attributePaths = {"student", "athleticSport"})
    @Query("""
            select athlete
            from StudentAthlete athlete
            where athlete.active = true
              and athlete.student.id in :studentIds
            order by athlete.athleticSport.name asc,
                     athlete.id asc
            """)
    List<StudentAthlete> findActiveByStudentIds(@Param("studentIds") List<Long> studentIds);
}
