package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.recommendation.Recommendation;

import java.time.LocalDateTime;

public record RecommendationResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) MemberSummaryResponse member,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ProfileSummaryResponse profile,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean visible,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime modifiedAt
) {
    public static RecommendationResponse of(Recommendation recommendation, Member member, Profile profile, String picture) {
        return new RecommendationResponse(
                recommendation.id(),
                MemberSummaryResponse.of(member, picture),
                ProfileSummaryResponse.of(profile),
                recommendation.content(),
                recommendation.visible(),
                recommendation.createdAt(),
                recommendation.modifiedAt()
        );
    }
}
