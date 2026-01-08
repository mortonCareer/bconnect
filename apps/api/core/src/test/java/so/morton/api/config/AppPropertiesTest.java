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
        AppProperties props = new AppProperties("", "user", "pass", "key", "secret", "region", "bucket");

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
        AppProperties props = new AppProperties("url", "", "pass", "key", "secret", "region", "bucket");

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
        AppProperties props = new AppProperties("url", "user", "", "key", "secret", "region", "bucket");

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .isEqualTo("DATABASE_PASSWORD is required");
    }

    @Test
    void shouldFailWhenAwsAccessKeyIsBlank() {
        // given
        AppProperties props = new AppProperties("url", "user", "pass", "", "secret", "region", "bucket");

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .isEqualTo("AWS_ACCESS_KEY_ID is required");
    }

    @Test
    void shouldFailWhenAwsSecretKeyIsBlank() {
        // given
        AppProperties props = new AppProperties("url", "user", "pass", "key", "", "region", "bucket");

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).hasSize(1);
        assertThat(violations.iterator().next().getMessage())
                .isEqualTo("AWS_SECRET_ACCESS_KEY is required");
    }

    @Test
    void shouldFailWhenAllFieldsAreBlank() {
        // given
        AppProperties props = new AppProperties("", "", "", "", "", "", "");

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).hasSize(7);
    }

    @Test
    void shouldPassWhenAllFieldsAreProvided() {
        // given
        AppProperties props = new AppProperties(
                "jdbc:postgresql://localhost/db",
                "user",
                "pass",
                "AKIAIOSFODNN7EXAMPLE",
                "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
                "ap-northeast-2",
                "my-bucket"
        );

        // when
        Set<ConstraintViolation<AppProperties>> violations = validator.validate(props);

        // then
        assertThat(violations).isEmpty();
    }
}
