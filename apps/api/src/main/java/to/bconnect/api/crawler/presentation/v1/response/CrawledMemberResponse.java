package to.bconnect.api.crawler.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.crawler.storage.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record CrawledMemberResponse(
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
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) CrawledProfileResponse profile,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<CrawledCredentialResponse> credentials,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) List<CrawledPostResponse> posts
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
