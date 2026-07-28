package to.bconnect.api.oneclick.infrastructure.kcomwel;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

// 근로복지공단 API 설정
@Validated
@ConfigurationProperties(prefix = "app.kcomwel")
public record KcomwelProperties(
        @NotBlank(message = "app.kcomwel.service-key must not be blank")
        String serviceKey
) {}
