package com.msm.sis.api.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(
        name = "course_section_instructor",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_course_section_instructor_unique",
                        columnNames = {"section_id", "instructor_user_id"}
                )
        }
)
public class CourseSectionInstructor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "course_section_instructor_id")
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id", nullable = false)
    private CourseSection courseSection;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_user_id", nullable = false)
    private SisUser instructorUser;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_user_id", referencedColumnName = "user_id", insertable = false, updatable = false)
    private Staff instructorStaff;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructional_assignment_role_id", nullable = false)
    private InstructionalAssignmentRole role;

    @Column(name = "can_view_grades", nullable = false)
    private boolean canViewGrades = false;

    @Column(name = "can_manage_grades", nullable = false)
    private boolean canManageGrades = false;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public boolean isPrimary() {
        return role != null && "PRIMARY_INSTRUCTOR".equals(role.getCode());
    }
}
