package to.bconnect.api;


import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass.Predicates;
import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

@AnalyzeClasses(packages = {"to.bconnect.api"}, importOptions = DoNotIncludeTests.class)
public class LayerDependencyTest {

    private static final String PRESENTATION = "..presentation..";
    private static final String DOMAIN = "..domain..";
    private static final String STORAGE = "..storage..";

	@ArchTest
	static final ArchRule layerDependenciesRule = layeredArchitecture().consideringOnlyDependenciesInLayers()
			.layer(PRESENTATION).definedBy("..presentation..")
			.layer(DOMAIN).definedBy("..domain..")
            .layer(STORAGE).definedBy("..storage..")

			.whereLayer(PRESENTATION).mayNotBeAccessedByAnyLayer()
			.whereLayer(DOMAIN).mayOnlyBeAccessedByLayers(PRESENTATION)
            .whereLayer(STORAGE).mayOnlyBeAccessedByLayers(PRESENTATION, DOMAIN);

	@ArchTest
	ArchRule cycleCheck = slices().matching("to.bconnect.api.(*)..")
			.should().beFreeOfCycles();
}