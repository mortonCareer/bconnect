package to.bconnect.api;


import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.Disabled;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAnyPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(packages = "to.bconnect.api", importOptions = DoNotIncludeTests.class)
public class PackageDependencyTest {

    private static final String SOCKET = "..socket..";
    private static final String CORE = "..core..";
    private static final String SECURITY = "..security..";
    private static final String STORAGE = "..storage..";
    private static final String COMMON = "..common..";
    private static final String SUPPORT = "..support..";
    private static final String ATTACHMENT = "..attachment..";

	@ArchTest
	ArchRule socketPackageRule = classes().that().resideInAPackage(SOCKET)
			.should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET);

	@ArchTest
	ArchRule corePackageRule = classes().that().resideInAPackage(CORE)
			.should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE);

    @ArchTest
    ArchRule securityPackageRule = classes().that().resideInAPackage(SECURITY)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, SECURITY);

    @ArchTest
    ArchRule attachmentPackageRule = classes().that().resideInAPackage(ATTACHMENT)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, SECURITY, ATTACHMENT);

    @ArchTest
    ArchRule storagePackageRule = classes().that().resideInAPackage(STORAGE)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, SECURITY, STORAGE, ATTACHMENT);

    @ArchTest
    ArchRule commonPackageRule = classes().that().resideInAPackage(COMMON)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, SECURITY, STORAGE, COMMON, ATTACHMENT)
            .andShould().onlyDependOnClassesThat(
                    resideInAnyPackage(COMMON).or(DescribedPredicate.not(resideInAnyPackage("to.bconnect.api")))
            );

    @ArchTest
    ArchRule supportPackageRule = classes().that().resideInAPackage(SUPPORT)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, SECURITY, SUPPORT, ATTACHMENT)
            .andShould().onlyDependOnClassesThat(
                    resideInAnyPackage(SUPPORT).or(DescribedPredicate.not(resideInAnyPackage("to.bconnect.api")))
            );

	@ArchTest
	ArchRule cycleCheck = slices().matching("to.bconnect.api.(*)..")
			.should().beFreeOfCycles();
}