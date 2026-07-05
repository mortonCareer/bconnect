package to.bconnect.api.crawler.presentation.response;

import to.bconnect.api.crawler.storage.CrawledCredentialEntity;
import to.bconnect.api.crawler.storage.CrawledCredentialType;

public record CrawledCredentialResponse(
        Long id,
        CrawledCredentialType type,
        String name
) {
    public static CrawledCredentialResponse of(CrawledCredentialEntity credential) {
        return new CrawledCredentialResponse(
                credential.getId(),
                credential.getType(),
                credential.getName()
        );
    }
}
