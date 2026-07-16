package to.bconnect.api.crawler.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.crawler.storage.CrawledMemberEntity;
import to.bconnect.api.crawler.storage.CrawledProfileEntity;

import java.time.Instant;

public record CrawledMemberSummaryResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String company,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String name,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String phone,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String picture,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String role,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String brn,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String email,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Instant modifiedAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) CrawledProfileResponse profile
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
