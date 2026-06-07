package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.recommendation.RecommendationDetail;
import to.bconnect.api.security.member.MaskedMemberResponse;

import java.time.LocalDateTime;

public record RecommendationResponse(
        Long id,
        MaskedMemberResponse member,
        ProfileResponse profile,
        String content,
        boolean visible,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static RecommendationResponse of(RecommendationDetail detail) {
        return new RecommendationResponse(
                detail.id(),
                MaskedMemberResponse.of(detail.member()),
                ProfileResponse.of(detail.profile()),
                detail.content(),
                detail.visible(),
                detail.createdAt(),
                detail.modifiedAt()
        );
    }
}
