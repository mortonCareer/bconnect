package to.bconnect.api;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import lombok.val;

import java.util.Arrays;
import java.util.stream.Stream;

import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAnyPackage;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;

@AnalyzeClasses(packages = "to.bconnect.api", importOptions = DoNotIncludeTests.class)
public class DomainDependencyTest {

    private static final String DOMAIN = "..core.domain.";
    private static final String SHARED = "profile";

    @ArchTest ArchRule boardDomainRule = domainRule("board", "drive");
    @ArchTest ArchRule chatDomainRule = domainRule("chat");
    @ArchTest ArchRule companyDomainRule = domainRule("company");
    @ArchTest ArchRule coworkerDomainRule = domainRule("coworker");
    @ArchTest ArchRule credentialDomainRule = domainRule("credential");
    @ArchTest ArchRule driveDomainRule = domainRule("drive");
    @ArchTest ArchRule memberDomainRule = domainRule("member");
    @ArchTest ArchRule offerDomainRule = domainRule("offer", "task", "chat");
    @ArchTest ArchRule postDomainRule = domainRule("post");
    @ArchTest ArchRule profileDomainRule = domainRule("profile");
    @ArchTest ArchRule projectDomainRule = domainRule("project", "task");
    @ArchTest ArchRule recommendationDomainRule = domainRule("recommendation");
    @ArchTest ArchRule taskDomainRule = domainRule("task");

    private static ArchRule domainRule(String domain, String... allowed) {
        val accessible = Stream.concat(Stream.of(domain, SHARED), Arrays.stream(allowed))
                .map(it -> DOMAIN + it + "..")
                .toArray(String[]::new);

        return classes().that().resideInAPackage(DOMAIN + domain + "..")
                .should().onlyDependOnClassesThat(resideInAnyPackage(accessible)
                        .or(DescribedPredicate.not(resideInAnyPackage("..core.domain.."))));
    }
}
