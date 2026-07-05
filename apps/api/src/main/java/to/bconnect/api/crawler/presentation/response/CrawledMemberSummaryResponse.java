package to.bconnect.api.crawler.presentation.response;

import to.bconnect.api.crawler.storage.CrawledMemberEntity;
import to.bconnect.api.crawler.storage.CrawledPlatform;
import to.bconnect.api.crawler.storage.CrawledProfileEntity;
import to.bconnect.api.crawler.storage.CrawledRegion;

import java.util.Set;

public record CrawledMemberSummaryResponse(
        Long id,
        String company,
        String name,
        String phone,
        String picture,
        String role,
        String brn,
        String email,
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
    public static CrawledMemberSummaryResponse of(CrawledMemberEntity member, CrawledProfileEntity profile) {
        return new CrawledMemberSummaryResponse(
                member.getId(),
                member.getCompany(),
                member.getName(),
                member.getPhone(),
                member.getPicture(),
                member.getRole(),
                member.getBrn(),
                member.getEmail(),
                profile == null ? null : profile.getPrimaryTrade(),
                profile == null ? Set.of() : profile.getTrades(),
                profile == null ? null : profile.getExperience(),
                profile == null ? null : profile.getHeadline(),
                profile == null ? null : profile.getAbout(),
                profile == null ? null : profile.getAddress(),
                profile == null ? null : profile.getState(),
                profile == null ? null : profile.getUrl(),
                profile == null ? null : profile.getPlatform()
        );
    }
}
