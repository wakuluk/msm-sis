package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.AcademicSubTermStatus;
import com.msm.sis.api.entity.AcademicYear;
import com.msm.sis.api.entity.Course;
import com.msm.sis.api.entity.CourseOffering;
import com.msm.sis.api.entity.CourseOfferingSubTerm;
import com.msm.sis.api.entity.CourseVersion;
import com.msm.sis.api.entity.AcademicSubject;
import com.msm.sis.api.entity.AcademicSubTerm;
import jakarta.persistence.EntityGraph;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Repository
public class CourseOfferingRepositoryImpl implements CourseOfferingRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<CourseOffering> searchCourseOfferings(
            String academicYearCode,
            String subTermCode,
            String departmentCode,
            String subjectCode,
            String courseNumber,
            String courseCode,
            String title,
            String description,
            BigDecimal minCredits,
            BigDecimal maxCredits,
            Boolean variableCredit,
            List<String> subTermStatusCodes,
            boolean includeInactive,
            Boolean isPublished,
            Pageable pageable
    ) {
        CriteriaBuilder criteriaBuilder = entityManager.getCriteriaBuilder();

        CriteriaQuery<CourseOffering> query = criteriaBuilder.createQuery(CourseOffering.class);
        Root<CourseOffering> root = query.from(CourseOffering.class);
        SearchJoins joins = createSearchJoins(root);

        List<Predicate> predicates = buildPredicates(
                criteriaBuilder,
                root,
                joins,
                academicYearCode,
                subTermCode,
                departmentCode,
                subjectCode,
                courseNumber,
                courseCode,
                title,
                description,
                minCredits,
                maxCredits,
                variableCredit,
                subTermStatusCodes,
                includeInactive,
                isPublished
        );

        query.select(root)
                .distinct(true)
                .where(predicates.toArray(Predicate[]::new))
                .orderBy(buildOrders(criteriaBuilder, root, joins, pageable.getSort()));

        TypedQuery<CourseOffering> typedQuery = entityManager.createQuery(query);
        typedQuery.setHint("jakarta.persistence.loadgraph", createSearchEntityGraph());
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());

        List<CourseOffering> results = typedQuery.getResultList();

        CriteriaQuery<Long> countQuery = criteriaBuilder.createQuery(Long.class);
        Root<CourseOffering> countRoot = countQuery.from(CourseOffering.class);
        SearchJoins countJoins = createSearchJoins(countRoot);
        List<Predicate> countPredicates = buildPredicates(
                criteriaBuilder,
                countRoot,
                countJoins,
                academicYearCode,
                subTermCode,
                departmentCode,
                subjectCode,
                courseNumber,
                courseCode,
                title,
                description,
                minCredits,
                maxCredits,
                variableCredit,
                subTermStatusCodes,
                includeInactive,
                isPublished
        );

        countQuery.select(criteriaBuilder.countDistinct(countRoot))
                .where(countPredicates.toArray(Predicate[]::new));

        long total = entityManager.createQuery(countQuery).getSingleResult();

        return new PageImpl<>(results, pageable, total);
    }

    @Override
    public Optional<CourseOffering> findPublicVisibleById(
            Long courseOfferingId,
            List<String> subTermStatusCodes
    ) {
        CriteriaBuilder criteriaBuilder = entityManager.getCriteriaBuilder();
        CriteriaQuery<CourseOffering> query = criteriaBuilder.createQuery(CourseOffering.class);
        Root<CourseOffering> root = query.from(CourseOffering.class);
        SearchJoins joins = createSearchJoins(root);

        List<Predicate> predicates = new ArrayList<>();
        predicates.add(criteriaBuilder.equal(root.get("id"), courseOfferingId));
        addStatusInPredicate(criteriaBuilder, predicates, joins.subTermStatus.get("code"), subTermStatusCodes);
        predicates.add(criteriaBuilder.isTrue(joins.department.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.subject.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.course.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.academicYear.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.subTerm.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.subTermStatus.get("active")));

        query.select(root)
                .distinct(true)
                .where(predicates.toArray(Predicate[]::new));

        TypedQuery<CourseOffering> typedQuery = entityManager.createQuery(query);
        typedQuery.setHint("jakarta.persistence.loadgraph", createSearchEntityGraph());

        return typedQuery.getResultList().stream().findFirst();
    }

    private SearchJoins createSearchJoins(Root<CourseOffering> root) {
        Join<CourseOffering, CourseVersion> courseVersion = root.join("courseVersion", JoinType.INNER);
        Join<CourseVersion, Course> course = courseVersion.join("course", JoinType.INNER);
        Join<Course, AcademicSubject> subject = course.join("subject", JoinType.INNER);
        Join<AcademicSubject, AcademicDepartment> department = subject.join("department", JoinType.INNER);
        Join<CourseOffering, AcademicYear> academicYear = root.join("academicYear", JoinType.INNER);
        Join<CourseOffering, CourseOfferingSubTerm> courseOfferingSubTerm = root.join("courseOfferingSubTerms", JoinType.LEFT);
        Join<CourseOfferingSubTerm, AcademicSubTerm> subTerm = courseOfferingSubTerm.join("subTerm", JoinType.LEFT);
        Join<AcademicSubTerm, AcademicSubTermStatus> subTermStatus = subTerm.join("status", JoinType.LEFT);

        return new SearchJoins(
                courseVersion,
                course,
                subject,
                department,
                academicYear,
                courseOfferingSubTerm,
                subTerm,
                subTermStatus
        );
    }

    private List<Predicate> buildPredicates(
            CriteriaBuilder criteriaBuilder,
            Root<CourseOffering> root,
            SearchJoins joins,
            String academicYearCode,
            String subTermCode,
            String departmentCode,
            String subjectCode,
            String courseNumber,
            String courseCode,
            String title,
            String description,
            BigDecimal minCredits,
            BigDecimal maxCredits,
            Boolean variableCredit,
            List<String> subTermStatusCodes,
            boolean includeInactive,
            Boolean isPublished
    ) {
        List<Predicate> predicates = new ArrayList<>();

        addEqualsIgnoreCasePredicate(criteriaBuilder, predicates, joins.academicYear.get("code"), academicYearCode);
        addEqualsIgnoreCasePredicate(criteriaBuilder, predicates, joins.subTerm.get("code"), subTermCode);
        addEqualsIgnoreCasePredicate(criteriaBuilder, predicates, joins.department.get("code"), departmentCode);
        addEqualsIgnoreCasePredicate(criteriaBuilder, predicates, joins.subject.get("code"), subjectCode);
        addContainsIgnoreCasePredicate(criteriaBuilder, predicates, joins.course.get("courseNumber"), courseNumber);
        addCourseCodePredicate(criteriaBuilder, predicates, joins.subject.get("code"), joins.course.get("courseNumber"), courseCode);
        addContainsIgnoreCasePredicate(criteriaBuilder, predicates, joins.courseVersion.get("title"), title);
        addContainsIgnoreCasePredicate(criteriaBuilder, predicates, joins.courseVersion.get("catalogDescription"), description);

        if (minCredits != null) {
            predicates.add(criteriaBuilder.greaterThanOrEqualTo(joins.courseVersion.get("minCredits"), minCredits));
        }

        if (maxCredits != null) {
            predicates.add(criteriaBuilder.lessThanOrEqualTo(joins.courseVersion.get("maxCredits"), maxCredits));
        }

        if (variableCredit != null) {
            predicates.add(criteriaBuilder.equal(joins.courseVersion.get("variableCredit"), variableCredit));
        }

        addStatusInPredicate(criteriaBuilder, predicates, joins.subTermStatus.get("code"), subTermStatusCodes);

        if (isPublished != null) {
            predicates.add(criteriaBuilder.equal(joins.academicYear.get("isPublished"), isPublished));
        }

        if (!includeInactive) {
            predicates.add(criteriaBuilder.isTrue(joins.department.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.subject.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.course.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.academicYear.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.subTerm.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.subTermStatus.get("active")));
        }

        return predicates;
    }

    private void addEqualsIgnoreCasePredicate(
            CriteriaBuilder criteriaBuilder,
            List<Predicate> predicates,
            Path<String> path,
            String value
    ) {
        if (value == null || value.isBlank()) {
            return;
        }

        predicates.add(criteriaBuilder.equal(
                criteriaBuilder.lower(path),
                value.trim().toLowerCase(Locale.ROOT)
        ));
    }

    private void addContainsIgnoreCasePredicate(
            CriteriaBuilder criteriaBuilder,
            List<Predicate> predicates,
            Path<String> path,
            String value
    ) {
        if (value == null || value.isBlank()) {
            return;
        }

        predicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(path),
                "%" + value.trim().toLowerCase(Locale.ROOT) + "%"
        ));
    }

    private void addCourseCodePredicate(
            CriteriaBuilder criteriaBuilder,
            List<Predicate> predicates,
            Path<String> subjectCodePath,
            Path<String> courseNumberPath,
            String courseCode
    ) {
        if (courseCode == null || courseCode.isBlank()) {
            return;
        }

        String normalizedCourseCode = "%" + courseCode.trim().toLowerCase(Locale.ROOT) + "%";
        Expression<String> courseCodeWithSpace = criteriaBuilder.concat(
                criteriaBuilder.concat(subjectCodePath, " "),
                courseNumberPath
        );
        Expression<String> courseCodeWithoutSpace = criteriaBuilder.concat(subjectCodePath, courseNumberPath);

        predicates.add(criteriaBuilder.or(
                criteriaBuilder.like(criteriaBuilder.lower(courseCodeWithSpace), normalizedCourseCode),
                criteriaBuilder.like(criteriaBuilder.lower(courseCodeWithoutSpace), normalizedCourseCode)
        ));
    }

    private void addStatusInPredicate(
            CriteriaBuilder criteriaBuilder,
            List<Predicate> predicates,
            Path<String> path,
            List<String> statusCodes
    ) {
        if (statusCodes == null || statusCodes.isEmpty()) {
            return;
        }

        predicates.add(criteriaBuilder.upper(path).in(normalizeStatusCodes(statusCodes)));
    }

    private List<Order> buildOrders(
            CriteriaBuilder criteriaBuilder,
            Root<CourseOffering> root,
            SearchJoins joins,
            Sort sort
    ) {
        List<Order> orders = new ArrayList<>();

        for (Sort.Order order : sort) {
            Path<?> path = resolvePath(root, joins, order.getProperty());
            orders.add(order.isAscending() ? criteriaBuilder.asc(path) : criteriaBuilder.desc(path));
        }

        return orders;
    }

    private Path<?> resolvePath(Root<CourseOffering> root, SearchJoins joins, String propertyPath) {
        Map<String, From<?, ?>> fromByPrefix = Map.ofEntries(
                Map.entry("", root),
                Map.entry("courseVersion", joins.courseVersion),
                Map.entry("courseVersion.course", joins.course),
                Map.entry("courseVersion.course.subject", joins.subject),
                Map.entry("courseVersion.course.subject.department", joins.department),
                Map.entry("academicYear", joins.academicYear),
                Map.entry("courseOfferingSubTerms", joins.courseOfferingSubTerm),
                Map.entry("courseOfferingSubTerms.subTerm", joins.subTerm),
                Map.entry("subTerm", joins.subTerm),
                Map.entry("subTerm.status", joins.subTermStatus),
                Map.entry("courseOfferingSubTerms.subTerm.status", joins.subTermStatus)
        );

        int lastDotIndex = propertyPath.lastIndexOf('.');
        String prefix = lastDotIndex < 0 ? "" : propertyPath.substring(0, lastDotIndex);
        String attribute = lastDotIndex < 0 ? propertyPath : propertyPath.substring(lastDotIndex + 1);
        From<?, ?> from = fromByPrefix.get(prefix);

        if (from == null) {
            throw new IllegalArgumentException("Unsupported sort property path: " + propertyPath);
        }

        return from.get(attribute);
    }

    private EntityGraph<CourseOffering> createSearchEntityGraph() {
        EntityGraph<CourseOffering> graph = entityManager.createEntityGraph(CourseOffering.class);
        graph.addAttributeNodes("academicYear", "courseVersion", "courseOfferingSubTerms");

        var courseOfferingSubTermGraph = graph.addSubgraph("courseOfferingSubTerms");
        courseOfferingSubTermGraph.addAttributeNodes("subTerm");

        var subTermGraph = courseOfferingSubTermGraph.addSubgraph("subTerm");
        subTermGraph.addAttributeNodes("academicYear", "status");

        var courseVersionGraph = graph.addSubgraph("courseVersion");
        courseVersionGraph.addAttributeNodes("course");

        var courseGraph = courseVersionGraph.addSubgraph("course");
        courseGraph.addAttributeNodes("subject");

        var subjectGraph = courseGraph.addSubgraph("subject");
        subjectGraph.addAttributeNodes("department");

        return graph;
    }

    private List<String> normalizeStatusCodes(List<String> statusCodes) {
        List<String> normalizedStatusCodes = new ArrayList<>();

        for (String statusCode : statusCodes) {
            if (statusCode != null && !statusCode.isBlank()) {
                normalizedStatusCodes.add(statusCode.trim().toUpperCase(Locale.ROOT));
            }
        }

        return normalizedStatusCodes;
    }

    private record SearchJoins(
            Join<CourseOffering, CourseVersion> courseVersion,
            Join<CourseVersion, Course> course,
            Join<Course, AcademicSubject> subject,
            Join<AcademicSubject, AcademicDepartment> department,
            Join<CourseOffering, AcademicYear> academicYear,
            Join<CourseOffering, CourseOfferingSubTerm> courseOfferingSubTerm,
            Join<CourseOfferingSubTerm, AcademicSubTerm> subTerm,
            Join<AcademicSubTerm, AcademicSubTermStatus> subTermStatus
    ) {
    }
}
