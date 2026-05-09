package com.msm.sis.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "instructional_assignment_role")
public class InstructionalAssignmentRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "instructional_assignment_role_id")
    private Long id;

    @Column(name = "code", nullable = false, unique = true)
    private String code;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "counts_for_conflict_check", nullable = false)
    private boolean countsForConflictCheck = true;

    @Column(name = "default_can_view_grades", nullable = false)
    private boolean defaultCanViewGrades = false;

    @Column(name = "default_can_manage_grades", nullable = false)
    private boolean defaultCanManageGrades = false;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
