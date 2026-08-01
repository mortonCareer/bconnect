package to.bconnect.api.oneclick.infrastructure;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.data-go")
// 공공데이터포털 서비스키 설정. 국세청 · 근로복지공단 공용
public record DataGoProperties(
        @NotBlank(message = "app.data-go.service-key must not be blank")
        String serviceKey
) {}
