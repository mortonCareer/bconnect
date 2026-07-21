package to.bconnect.api.crawler.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.crawler.storage.CrawledPlatform;
import to.bconnect.api.crawler.storage.CrawledProfileEntity;
import to.bconnect.api.crawler.storage.CrawledRegion;

import java.util.Set;

public record CrawledProfileResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String primaryTrade,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Set<String> trades,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) Integer experience,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String headline,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String address,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) CrawledRegion state,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String url,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) CrawledPlatform platform
) {
    public static CrawledProfileResponse of(CrawledProfileEntity profile) {
        return new CrawledProfileResponse(
                profile.getPrimaryTrade(),
                profile.getTrades(),
                profile.getExperience(),
                profile.getHeadline(),
                profile.getAddress(),
                profile.getState(),
                profile.getUrl(),
                profile.getPlatform()
        );
    }
}
