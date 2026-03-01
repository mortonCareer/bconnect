package so.morton.api.support;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AssignableTypeFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ExceptionCode 무결성 테스트")
class ExceptionCodeTest {

    private static final String BASE_PACKAGE = "so.morton.api";

    @SuppressWarnings("unchecked")
    private static List<ExceptionCode> allExceptionCodes() {
        ClassPathScanningCandidateComponentProvider scanner =
                new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AssignableTypeFilter(ExceptionCode.class));

        List<ExceptionCode> codes = new ArrayList<>();
        for (BeanDefinition bd : scanner.findCandidateComponents(BASE_PACKAGE)) {
            try {
                Class<?> clazz = Class.forName(bd.getBeanClassName());
                if (clazz.isEnum()) {
                    codes.addAll(Arrays.asList(
                            ((Class<? extends ExceptionCode>) clazz).getEnumConstants()));
                }
            } catch (ClassNotFoundException e) {
                throw new RuntimeException(
                        "ExceptionCode 구현체 로딩 실패: " + bd.getBeanClassName(), e);
            }
        }
        return codes;
    }

    @Test
    @DisplayName("ExceptionCode 중복 사용 확인")
    void ExceptionCode_중복_사용_확인() {
        List<ExceptionCode> allCodes = allExceptionCodes();

        Map<String, Long> counts = allCodes.stream()
                .collect(Collectors.groupingBy(ExceptionCode::getCode, Collectors.counting()));

        Set<String> duplicates = counts.entrySet().stream()
                .filter(e -> e.getValue() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        assertThat(duplicates)
                .as("중복된 ExceptionCode: %s", duplicates)
                .isEmpty();
    }
}
