package to.bconnect.api;


import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAnyPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(packages = "to.bconnect.api", importOptions = DoNotIncludeTests.class)
public class PackageDependencyTest {

    private static final String WEBSOCKET = "..ws..";
    private static final String CORE = "..core..";
    private static final String SECURITY = "..security..";
    private static final String COMMON = "..common..";
    private static final String SUPPORT = "..support..";

	@ArchTest
	ArchRule socketioPackageRule = classes().that().resideInAPackage(WEBSOCKET)
			.should().onlyHaveDependentClassesThat().resideInAnyPackage(WEBSOCKET);

	@ArchTest
	ArchRule modulesPackageRule = classes().that().resideInAPackage(CORE)
			.should().onlyHaveDependentClassesThat().resideInAnyPackage(SECURITY, CORE);

	@ArchTest
	ArchRule infraPackageRule = classes().that().resideInAPackage(SUPPORT)
			.should().onlyHaveDependentClassesThat().resideInAnyPackage(SUPPORT, CORE, SECURITY)
			.andShould().onlyDependOnClassesThat(
					resideInAnyPackage(SUPPORT).or(DescribedPredicate.not(resideInAnyPackage("to.bconnect.api")))
			);

	@ArchTest
	ArchRule cycleCheck = slices().matching("to.bconnect.api.(*)..")
			.should().beFreeOfCycles();

}