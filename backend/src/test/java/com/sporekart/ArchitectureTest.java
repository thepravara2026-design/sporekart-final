package com.sporekart;

import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.RestController;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

public class ArchitectureTest {

    private static JavaClasses importedClasses;

    @BeforeAll
    static void setUp() {
        importedClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.sporekart");
    }

    @Test
    @DisplayName("Controllers must reside only in 'api' subpackages and be annotated with @RestController")
    void controllersShouldOnlyResideInApiPackages() {
        ArchRule rule = classes()
                .that().areAnnotatedWith(RestController.class)
                .should().resideInAPackage("..api..");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("Repositories must reside only in 'infrastructure' subpackages")
    void repositoriesShouldOnlyResideInInfrastructurePackages() {
        ArchRule rule = classes()
                .that().areAnnotatedWith(Repository.class)
                .or().haveSimpleNameEndingWith("Repository")
                .should().resideInAPackage("..infrastructure..");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("Domain entities must reside only in 'domain' subpackages")
    void domainEntitiesShouldOnlyResideInDomainPackages() {
        ArchRule rule = classes()
                .that().areAnnotatedWith(jakarta.persistence.Entity.class)
                .should().resideInAPackage("..domain..");

        rule.check(importedClasses);
    }

    @Test
    @DisplayName("No module should access repositories of another module directly")
    void noCrossModuleRepositoryAccess() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("com.sporekart.order..")
                .should().dependOnClassesThat().resideInAPackage("com.sporekart.catalog.infrastructure..");

        rule.check(importedClasses);
    }
}
