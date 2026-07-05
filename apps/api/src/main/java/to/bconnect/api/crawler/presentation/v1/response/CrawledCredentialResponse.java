package to.bconnect.api.crawler.presentation.v1.response;

import to.bconnect.api.crawler.storage.CrawledCredentialEntity;
import to.bconnect.api.crawler.storage.CrawledCredentialType;

import java.time.LocalDateTime;

public record CrawledCredentialResponse(
        Long id,
        Long memberId,
        CrawledCredentialType type,
        String name,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
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
