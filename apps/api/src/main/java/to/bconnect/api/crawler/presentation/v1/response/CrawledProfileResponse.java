package to.bconnect.api.crawler.presentation.v1.response;

import to.bconnect.api.crawler.storage.CrawledPlatform;
import to.bconnect.api.crawler.storage.CrawledProfileEntity;
import to.bconnect.api.crawler.storage.CrawledRegion;

import java.util.Set;

public record CrawledProfileResponse(
        String primaryTrade,
        Set<String> trades,
        Integer experience,
        String headline,
        String about,
        String address,
        CrawledRegion state,
        String url,
        CrawledPlatform platform
) {
    public static CrawledProfileResponse of(CrawledProfileEntity profile) {
        return new CrawledProfileResponse(
                profile.getPrimaryTrade(),
                profile.getTrades(),
                profile.getExperience(),
                profile.getHeadline(),
                profile.getAbout(),
                profile.getAddress(),
                profile.getState(),
                profile.getUrl(),
                profile.getPlatform()
        );
    }
}
