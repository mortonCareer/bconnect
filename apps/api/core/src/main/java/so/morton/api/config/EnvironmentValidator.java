package so.morton.api.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;
import org.springframework.util.StringUtils;

import java.util.List;

@Component
@Profile({"prod", "dev"})
public class EnvironmentValidator {

    private static final Logger log = LoggerFactory.getLogger(EnvironmentValidator.class);

    private static final List<String> REQUIRED_VARS = List.of(
            "DATABASE_URL",
            "DATABASE_USERNAME",
            "DATABASE_PASSWORD",
            "JWT_SECRET",
            "SOLAPI_API_KEY",
            "SOLAPI_API_SECRET",
            "SOLAPI_SENDER_NUMBER"
            // TODO: AWS
    );

    private final Environment env;

    public EnvironmentValidator(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void validate() {
        List<String> missing = REQUIRED_VARS.stream()
                .filter(var -> !StringUtils.hasText(env.getProperty(var)))
                .toList();

        if (!missing.isEmpty()) {
            throw new IllegalStateException(
                    "필수 환경변수가 설정되지 않았습니다: " + missing);
        }

        log.info("=".repeat(60));
        log.info("Environment Variables Validated Successfully!");
        log.info("DATABASE_URL: {}", maskUrl(env.getProperty("DATABASE_URL")));
        log.info("DATABASE_USERNAME: {}", env.getProperty("DATABASE_USERNAME"));
        log.info("DATABASE_PASSWORD: ***");
        log.info("=".repeat(60));
    }

    private String maskUrl(String url) {
        if (url == null || url.length() < 10) {
            return "***";
        }
        return url.substring(0, Math.min(20, url.length())) + "...";
    }

    private String maskSecret(String secret) {
        if (secret == null || secret.length() < 8) {
            return "***";
        }
        return secret.substring(0, 4) + "..." + secret.substring(secret.length() - 4);
    }
}
