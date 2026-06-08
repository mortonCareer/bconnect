package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.recommendation.RecommendationDetail;

import java.time.LocalDateTime;

public record RecommendationResponse(
        Long id,
        MaskedMemberResponse member,
        String content,
        boolean visible,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static RecommendationResponse of(RecommendationDetail detail) {
        return new RecommendationResponse(
                detail.id(),
                MaskedMemberResponse.of(detail.member()),
                detail.content(),
                detail.visible(),
                detail.createdAt(),
                detail.modifiedAt()
        );
    }
}
