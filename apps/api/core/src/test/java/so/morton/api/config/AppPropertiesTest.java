package so.morton.api.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class AppPropertiesTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(org.springframework.boot.autoconfigure.AutoConfigurations.of(
                    ConfigurationPropertiesAutoConfiguration.class,
                    ValidationAutoConfiguration.class))
            .withUserConfiguration(AppProperties.class);

    @Test
    void appProperties_바인딩_성공() {
        contextRunner
                .withPropertyValues(
                        "app.cors.allowed-origins=http://localhost:3000",
                        "app.jwt.secret=test-secret-key-for-jwt-authentication-minimum-256-bits",
                        "app.jwt.access-token-expiration=1h",
                        "app.jwt.refresh-token-expiration=7d"
                )
                .run(context -> {
                    assertThat(context).hasSingleBean(AppProperties.class);
                    AppProperties props = context.getBean(AppProperties.class);
                    assertThat(props.jwt().secret()).isNotBlank();
                    assertThat(props.cors().allowedOrigins()).isNotEmpty();
                });
    }

    @Test
    void appProperties_jwt_secret_blank이면_실패() {
        contextRunner
                .withPropertyValues(
                        "app.cors.allowed-origins=http://localhost:3000",
                        "app.jwt.secret="
                )
                .run(context -> {
                    assertThat(context).hasFailed();
                });
    }

    @Test
    void appProperties_jwt_secret_짧으면_실패() {
        contextRunner
                .withPropertyValues(
                        "app.cors.allowed-origins=http://localhost:3000",
                        "app.jwt.secret=short-key",
                        "app.jwt.access-token-expiration=1h",
                        "app.jwt.refresh-token-expiration=7d"
                )
                .run(context -> {
                    assertThat(context).hasFailed();
                });
    }

    @Test
    void appProperties_jwt_expiration_null이면_실패() {
        contextRunner
                .withPropertyValues(
                        "app.cors.allowed-origins=http://localhost:3000",
                        "app.jwt.secret=test-secret"
                )
                .run(context -> {
                    assertThat(context).hasFailed();
                });
    }
}
