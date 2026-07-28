package to.bconnect.api;


import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAnyPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(packages = "to.bconnect.api", importOptions = DoNotIncludeTests.class)
public class PackageDependencyTest {

    private static final String SOCKET = "..socket..";
    private static final String CORE = "..core..";
    private static final String SECURITY = "..security..";
    private static final String STORAGE = "..storage..";
    private static final String COMMON = "..common..";
    private static final String SMS = "..sms..";
    private static final String ATTACHMENT = "..attachment..";
    private static final String CRAWLER = "..crawler..";
    private static final String ONECLICK = "to.bconnect.api.oneclick..";
    private static final String NOTIFICATION = "to.bconnect.api.notification..";

	@ArchTest
	ArchRule socketPackageRule = classes().that().resideInAPackage(SOCKET)
			.should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, NOTIFICATION);

	@ArchTest
	ArchRule corePackageRule = classes().that().resideInAPackage(CORE)
			.should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, NOTIFICATION);

    @ArchTest
    ArchRule attachmentPackageRule = classes().that().resideInAPackage(ATTACHMENT)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, ATTACHMENT, NOTIFICATION);

    @ArchTest
    ArchRule securityPackageRule = classes().that().resideInAPackage(SECURITY)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, ATTACHMENT, SECURITY, SMS, NOTIFICATION, ONECLICK);

    @ArchTest
    ArchRule storagePackageRule = classes().that().resideInAPackage(STORAGE)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, ATTACHMENT, SECURITY, STORAGE, CRAWLER, NOTIFICATION, ONECLICK);

    @ArchTest
    ArchRule commonPackageRule = classes().that().resideInAPackage(COMMON)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SOCKET, CORE, ATTACHMENT, SECURITY, STORAGE, COMMON, CRAWLER, NOTIFICATION, ONECLICK)
            .andShould().onlyDependOnClassesThat(
                    resideInAnyPackage(COMMON).or(DescribedPredicate.not(resideInAnyPackage("to.bconnect.api")))
            );

    @ArchTest
    ArchRule crawlerPackageRule = classes().that().resideInAPackage(CRAWLER)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(CRAWLER);

    @ArchTest
    ArchRule oneclickPackageRule = classes().that().resideInAPackage(ONECLICK)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(ONECLICK);

    @ArchTest
    ArchRule smsPackageRule = classes().that().resideInAPackage(SMS)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(SMS);

    @ArchTest
    ArchRule notificationPackageRule = classes().that().resideInAPackage(NOTIFICATION)
            .should().onlyHaveDependentClassesThat().resideInAnyPackage(NOTIFICATION)
            .andShould().onlyDependOnClassesThat(
                    resideInAnyPackage(NOTIFICATION, SOCKET, CORE, SECURITY, STORAGE, COMMON, ATTACHMENT)
                            .or(DescribedPredicate.not(resideInAnyPackage("to.bconnect.api"))));

    @ArchTest
    ArchRule notificationDomainIsPortSide = noClasses().that().resideInAPackage("..notification.domain..")
            .should().dependOnClassesThat().resideInAPackage("..notification.infrastructure..");

	@ArchTest
	ArchRule cycleCheck = slices().matching("to.bconnect.api.(*)..")
			.should().beFreeOfCycles();
}