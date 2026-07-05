package to.bconnect.api.crawler.presentation.v1.response;

import to.bconnect.api.crawler.storage.CrawledCredentialEntity;
import to.bconnect.api.crawler.storage.CrawledMemberEntity;
import to.bconnect.api.crawler.storage.CrawledPostEntity;
import to.bconnect.api.crawler.storage.CrawledProfileEntity;
import to.bconnect.api.crawler.storage.CrawledTaskEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record CrawledMemberResponse(
        Long id,
        String company,
        String name,
        String phone,
        String picture,
        String role,
        String brn,
        String email,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt,
        CrawledProfileResponse profile,
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
                member.getCreatedAt(),
                member.getModifiedAt(),
                profile == null ? null : CrawledProfileResponse.of(profile),
                credentials.stream().map(CrawledCredentialResponse::of).toList(),
                posts.stream().map(it -> CrawledPostResponse.of(it, taskMap.get(it.getTaskId()))).toList()
        );
    }
}
