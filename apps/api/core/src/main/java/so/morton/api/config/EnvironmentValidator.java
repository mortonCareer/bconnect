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
        // AppProperties가 주입되면 이미 validation이 완료된 상태
        // 환경 변수가 정상적으로 로드되었는지 로그 출력
        System.out.println("=".repeat(60));
        System.out.println("Environment Variables Validated Successfully!");
        System.out.println("DATABASE_URL: " + maskUrl(appProperties.databaseUrl()));
        System.out.println("DATABASE_USERNAME: " + appProperties.databaseUsername());
        System.out.println("DATABASE_PASSWORD: ***");
        System.out.println("=".repeat(60));
    }

    private String maskUrl(String url) {
        if (url == null || url.length() < 10) {
            return "***";
        }
        return url.substring(0, Math.min(20, url.length())) + "...";
    }
}
