package to.bconnect.api.oneclick.infrastructure.nts;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.nts")
// 국세청 API 설정
public record NtsProperties(
        @NotBlank(message = "app.nts.service-key must not be blank")
        String serviceKey
) {}
