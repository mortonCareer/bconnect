package to.bconnect.api.crawler.presentation.v1.response;

import to.bconnect.api.crawler.storage.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

public record CrawledMemberResponse(
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
        CrawledPlatform platform,
        List<CrawledCredentialResponse> credentials,
        List<CrawledPostResponse> posts
) {
    public static CrawledMemberResponse of(CrawledMemberEntity member, CrawledProfileEntity profile,
                                           List<CrawledCredentialEntity> credentials, List<CrawledPostEntity> posts,
                                           Map<Long, CrawledTaskEntity> taskMap) {
        return new CrawledMemberResponse(
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
                profile == null ? null : profile.getPlatform(),
                credentials.stream().map(CrawledCredentialResponse::of).toList(),
                posts.stream().map(it -> CrawledPostResponse.of(it, taskMap.get(it.getTaskId()))).toList()
        );
    }
}
