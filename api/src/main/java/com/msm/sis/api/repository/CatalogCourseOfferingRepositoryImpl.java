package com.msm.sis.api.repository;

import com.msm.sis.api.entity.AcademicDepartment;
import com.msm.sis.api.entity.CatalogAcademicYear;
import com.msm.sis.api.entity.CatalogCourse;
import com.msm.sis.api.entity.CatalogCourseOffering;
import com.msm.sis.api.entity.CatalogCourseOfferingStatus;
import com.msm.sis.api.entity.CatalogCourseVersion;
import com.msm.sis.api.entity.CatalogSubject;
import com.msm.sis.api.entity.CatalogTerm;
import com.msm.sis.api.entity.CatalogTermStatus;
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
public class CatalogCourseOfferingRepositoryImpl implements CatalogCourseOfferingRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<CatalogCourseOffering> searchCourseOfferings(
            String academicYearCode,
            String termCode,
            String departmentCode,
            String subjectCode,
            String courseNumber,
            String courseCode,
            String title,
            String description,
            BigDecimal minCredits,
            BigDecimal maxCredits,
            Boolean variableCredit,
            List<String> offeringStatusCodes,
            List<String> termStatusCodes,
            boolean includeInactive,
            Pageable pageable
    ) {
        CriteriaBuilder criteriaBuilder = entityManager.getCriteriaBuilder();

        CriteriaQuery<CatalogCourseOffering> query = criteriaBuilder.createQuery(CatalogCourseOffering.class);
        Root<CatalogCourseOffering> root = query.from(CatalogCourseOffering.class);
        SearchJoins joins = createSearchJoins(root);

        List<Predicate> predicates = buildPredicates(
                criteriaBuilder,
                root,
                joins,
                academicYearCode,
                termCode,
                departmentCode,
                subjectCode,
                courseNumber,
                courseCode,
                title,
                description,
                minCredits,
                maxCredits,
                variableCredit,
                offeringStatusCodes,
                termStatusCodes,
                includeInactive
        );

        query.select(root)
                .where(predicates.toArray(Predicate[]::new))
                .orderBy(buildOrders(criteriaBuilder, root, joins, pageable.getSort()));

        TypedQuery<CatalogCourseOffering> typedQuery = entityManager.createQuery(query);
        typedQuery.setHint("jakarta.persistence.loadgraph", createSearchEntityGraph());
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());

        List<CatalogCourseOffering> results = typedQuery.getResultList();

        CriteriaQuery<Long> countQuery = criteriaBuilder.createQuery(Long.class);
        Root<CatalogCourseOffering> countRoot = countQuery.from(CatalogCourseOffering.class);
        SearchJoins countJoins = createSearchJoins(countRoot);
        List<Predicate> countPredicates = buildPredicates(
                criteriaBuilder,
                countRoot,
                countJoins,
                academicYearCode,
                termCode,
                departmentCode,
                subjectCode,
                courseNumber,
                courseCode,
                title,
                description,
                minCredits,
                maxCredits,
                variableCredit,
                offeringStatusCodes,
                termStatusCodes,
                includeInactive
        );

        countQuery.select(criteriaBuilder.count(countRoot))
                .where(countPredicates.toArray(Predicate[]::new));

        long total = entityManager.createQuery(countQuery).getSingleResult();

        return new PageImpl<>(results, pageable, total);
    }

    @Override
    public Optional<CatalogCourseOffering> findPublicVisibleById(
            Long courseOfferingId,
            List<String> offeringStatusCodes,
            List<String> termStatusCodes
    ) {
        CriteriaBuilder criteriaBuilder = entityManager.getCriteriaBuilder();
        CriteriaQuery<CatalogCourseOffering> query = criteriaBuilder.createQuery(CatalogCourseOffering.class);
        Root<CatalogCourseOffering> root = query.from(CatalogCourseOffering.class);
        SearchJoins joins = createSearchJoins(root);

        List<Predicate> predicates = new ArrayList<>();
        predicates.add(criteriaBuilder.equal(root.get("id"), courseOfferingId));
        addStatusInPredicate(criteriaBuilder, predicates, joins.status.get("code"), offeringStatusCodes);
        addStatusInPredicate(criteriaBuilder, predicates, joins.termStatus.get("code"), termStatusCodes);
        predicates.add(criteriaBuilder.isTrue(joins.department.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.subject.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.course.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.courseVersion.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.academicYear.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.term.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.termStatus.get("active")));
        predicates.add(criteriaBuilder.isTrue(joins.status.get("active")));

        query.select(root).where(predicates.toArray(Predicate[]::new));

        TypedQuery<CatalogCourseOffering> typedQuery = entityManager.createQuery(query);
        typedQuery.setHint("jakarta.persistence.loadgraph", createSearchEntityGraph());

        return typedQuery.getResultList().stream().findFirst();
    }

    private SearchJoins createSearchJoins(Root<CatalogCourseOffering> root) {
        Join<CatalogCourseOffering, CatalogCourseVersion> courseVersion = root.join("courseVersion", JoinType.INNER);
        Join<CatalogCourseVersion, CatalogCourse> course = courseVersion.join("course", JoinType.INNER);
        Join<CatalogCourse, CatalogSubject> subject = course.join("subject", JoinType.INNER);
        Join<CatalogSubject, AcademicDepartment> department = subject.join("department", JoinType.INNER);
        Join<CatalogCourseOffering, CatalogTerm> term = root.join("term", JoinType.INNER);
        Join<CatalogTerm, CatalogAcademicYear> academicYear = term.join("academicYear", JoinType.INNER);
        Join<CatalogTerm, CatalogTermStatus> termStatus = term.join("status", JoinType.INNER);
        Join<CatalogCourseOffering, CatalogCourseOfferingStatus> status = root.join("status", JoinType.INNER);

        return new SearchJoins(courseVersion, course, subject, department, term, academicYear, termStatus, status);
    }

    private List<Predicate> buildPredicates(
            CriteriaBuilder criteriaBuilder,
            Root<CatalogCourseOffering> root,
            SearchJoins joins,
            String academicYearCode,
            String termCode,
            String departmentCode,
            String subjectCode,
            String courseNumber,
            String courseCode,
            String title,
            String description,
            BigDecimal minCredits,
            BigDecimal maxCredits,
            Boolean variableCredit,
            List<String> offeringStatusCodes,
            List<String> termStatusCodes,
            boolean includeInactive
    ) {
        List<Predicate> predicates = new ArrayList<>();

        addEqualsIgnoreCasePredicate(criteriaBuilder, predicates, joins.academicYear.get("code"), academicYearCode);
        addEqualsIgnoreCasePredicate(criteriaBuilder, predicates, joins.term.get("code"), termCode);
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

        addStatusInPredicate(criteriaBuilder, predicates, joins.status.get("code"), offeringStatusCodes);
        addStatusInPredicate(criteriaBuilder, predicates, joins.termStatus.get("code"), termStatusCodes);

        if (!includeInactive) {
            predicates.add(criteriaBuilder.isTrue(joins.department.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.subject.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.course.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.courseVersion.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.academicYear.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.term.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.termStatus.get("active")));
            predicates.add(criteriaBuilder.isTrue(joins.status.get("active")));
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
            Root<CatalogCourseOffering> root,
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

    private Path<?> resolvePath(Root<CatalogCourseOffering> root, SearchJoins joins, String propertyPath) {
        Map<String, From<?, ?>> fromByPrefix = Map.of(
                "", root,
                "courseVersion", joins.courseVersion,
                "courseVersion.course", joins.course,
                "courseVersion.course.subject", joins.subject,
                "courseVersion.course.subject.department", joins.department,
                "term", joins.term,
                "term.academicYear", joins.academicYear,
                "term.status", joins.termStatus,
                "status", joins.status
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

    private EntityGraph<CatalogCourseOffering> createSearchEntityGraph() {
        EntityGraph<CatalogCourseOffering> graph = entityManager.createEntityGraph(CatalogCourseOffering.class);
        graph.addAttributeNodes("term", "status", "courseVersion");

        var termGraph = graph.addSubgraph("term");
        termGraph.addAttributeNodes("academicYear", "status");

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
            Join<CatalogCourseOffering, CatalogCourseVersion> courseVersion,
            Join<CatalogCourseVersion, CatalogCourse> course,
            Join<CatalogCourse, CatalogSubject> subject,
            Join<CatalogSubject, AcademicDepartment> department,
            Join<CatalogCourseOffering, CatalogTerm> term,
            Join<CatalogTerm, CatalogAcademicYear> academicYear,
            Join<CatalogTerm, CatalogTermStatus> termStatus,
            Join<CatalogCourseOffering, CatalogCourseOfferingStatus> status
    ) {
    }
}
