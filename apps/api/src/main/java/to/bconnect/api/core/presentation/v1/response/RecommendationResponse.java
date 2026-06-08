package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.recommendation.Recommendation;
import to.bconnect.api.security.member.Member;

import java.time.LocalDateTime;

public record RecommendationResponse(
        Long id,
        MemberSummaryResponse member,
        String content,
        boolean visible,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static RecommendationResponse of(Recommendation detail, Member member) {
        return new RecommendationResponse(
                detail.id(),
                MemberSummaryResponse.of(member),
                detail.content(),
                detail.visible(),
                detail.createdAt(),
                detail.modifiedAt()
        );
    }
}
