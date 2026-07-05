package to.bconnect.api.crawler.presentation.v1.response;

import to.bconnect.api.crawler.storage.CrawledMemberEntity;
import to.bconnect.api.crawler.storage.CrawledProfileEntity;

import java.time.LocalDateTime;

public record CrawledMemberSummaryResponse(
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
        CrawledProfileResponse profile
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
                member.getCreatedAt(),
                member.getModifiedAt(),
                profile == null ? null : CrawledProfileResponse.of(profile)
        );
    }
}
