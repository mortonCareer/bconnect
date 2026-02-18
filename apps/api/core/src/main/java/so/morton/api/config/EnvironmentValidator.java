package so.morton.api.config;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

@Component
public class EnvironmentValidator {

    private final AppProperties appProperties;

    public EnvironmentValidator(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @PostConstruct
    public void validate() {
        System.out.println("=".repeat(60));
        System.out.println("Environment Variables Validated Successfully!");
        System.out.println("DATABASE_URL: " + maskUrl(appProperties.databaseUrl()));
        System.out.println("DATABASE_USERNAME: " + appProperties.databaseUsername());
        System.out.println("DATABASE_PASSWORD: ***");
        System.out.println("AWS_ACCESS_KEY_ID: " + maskSecret(appProperties.awsAccessKeyId()));
        System.out.println("AWS_SECRET_ACCESS_KEY: ***");
        System.out.println("AWS_REGION: " + appProperties.awsRegion());
        System.out.println("AWS_S3_BUCKET: " + appProperties.awsS3Bucket());
        System.out.println("=".repeat(60));
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
