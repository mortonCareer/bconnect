package to.bconnect.api;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption.DoNotIncludeTests;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.common.ExceptionCode;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ExceptionCodeTest {

    private static final String BASE_PACKAGE = "to.bconnect.api";

    @Test
    @DisplayName("ExceptionCode의 code는 중복되지 않는다")
    void exceptionCodesAreUnique() {
        List<String> codes = new ClassFileImporter()
                .withImportOption(new DoNotIncludeTests())
                .importPackages(BASE_PACKAGE)
                .stream()
                .filter(clazz -> clazz.isAssignableTo(ExceptionCode.class))
                .filter(JavaClass::isEnum)
                .flatMap(clazz -> Arrays.stream(clazz.reflect().getEnumConstants()))
                .map(constant -> ((ExceptionCode) constant).getCode())
                .toList();

        assertThat(codes)
                .as("중복된 ExceptionCode가 있습니다")
                .doesNotHaveDuplicates();
    }
}
