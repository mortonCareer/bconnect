package so.morton.api.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.validation.autoconfigure.ValidationAutoConfiguration;
import org.springframework.context.annotation.Configuration;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("AppProperties 테스트")
class AppPropertiesTest {
    @Configuration
    @EnableConfigurationProperties(AppProperties.class)
    static class TestConfig {}

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(
                    ConfigurationPropertiesAutoConfiguration.class,
                    ValidationAutoConfiguration.class))
            .withUserConfiguration(TestConfig.class);

    @Test
    @DisplayName("모든 프로퍼티를 정상적으로 바인딩한다")
    void bind_success() {
        // given
        var properties = new String[]{
                "app.cors.allowed-origins=http://localhost:3000",
                "app.jwt.secret=test-secret-key-for-jwt-authentication-minimum-256-bits",
                "app.jwt.access-token-expiration=1h",
                "app.jwt.refresh-token-expiration=7d"
        };

        // when & then
        contextRunner
                .withPropertyValues(properties)
                .run(context -> {
                    assertThat(context).hasSingleBean(AppProperties.class);
                    AppProperties props = context.getBean(AppProperties.class);
                    assertThat(props.jwt().secret()).isNotBlank();
                    assertThat(props.cors().allowedOrigins()).isNotEmpty();
                });
    }

    @Test
    @DisplayName("JWT secret이 빈 값이면 바인딩에 실패한다")
    void bind_blankJwtSecret() {
        // given
        var properties = new String[]{
                "app.cors.allowed-origins=http://localhost:3000",
                "app.jwt.secret="
        };

        // when & then
        contextRunner
                .withPropertyValues(properties)
                .run(context -> {
                    assertThat(context).hasFailed();
                });
    }

    @Test
    @DisplayName("JWT secret이 32자 미만이면 바인딩에 실패한다")
    void bind_shortJwtSecret() {
        // given
        var properties = new String[]{
                "app.cors.allowed-origins=http://localhost:3000",
                "app.jwt.secret=short-key",
                "app.jwt.access-token-expiration=1h",
                "app.jwt.refresh-token-expiration=7d"
        };

        // when & then
        contextRunner
                .withPropertyValues(properties)
                .run(context -> {
                    assertThat(context).hasFailed();
                });
    }

    @Test
    @DisplayName("JWT expiration이 누락되면 바인딩에 실패한다")
    void bind_nullJwtExpiration() {
        // given
        var properties = new String[]{
                "app.cors.allowed-origins=http://localhost:3000",
                "app.jwt.secret=test-secret"
        };

        // when & then
        contextRunner
                .withPropertyValues(properties)
                .run(context -> {
                    assertThat(context).hasFailed();
                });
    }
}
