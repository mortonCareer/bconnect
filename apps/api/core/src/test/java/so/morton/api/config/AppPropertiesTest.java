package so.morton.api.config;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class AppPropertiesTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void shouldFailWhenDatabaseUrlIsBlank() {
        // given
        AppProperties props = new AppProperties("", "user", "pass");

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .isEqualTo("DATABASE_URL is required");
    }

    @Test
    void shouldFailWhenDatabaseUsernameIsBlank() {
        // given
        AppProperties props = new AppProperties("url", "", "pass");

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .isEqualTo("DATABASE_USERNAME is required");
    }

    @Test
    void shouldFailWhenDatabasePasswordIsBlank() {
        // given
        AppProperties props = new AppProperties("url", "user", "");

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .isEqualTo("DATABASE_PASSWORD is required");
    }

    @Test
    void shouldFailWhenAllFieldsAreBlank() {
        // given
        AppProperties props = new AppProperties("", "", "");

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).hasSize(3);
    }

    @Test
    void shouldPassWhenAllFieldsAreProvided() {
        // given
        AppProperties props = new AppProperties("jdbc:postgresql://localhost/db", "user", "pass");

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).isEmpty();
    }
}
