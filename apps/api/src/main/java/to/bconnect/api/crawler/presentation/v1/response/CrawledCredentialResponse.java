package to.bconnect.api.crawler.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.crawler.storage.CrawledCredentialEntity;
import to.bconnect.api.crawler.storage.CrawledCredentialType;

import java.time.Instant;

public record CrawledCredentialResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) CrawledCredentialType type,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt
) {
    public static CrawledCredentialResponse of(CrawledCredentialEntity credential) {
        return new CrawledCredentialResponse(
                credential.getId(),
                credential.getMemberId(),
                credential.getType(),
                credential.getName(),
                credential.getCreatedAt(),
                credential.getModifiedAt()
        );
    }
}
