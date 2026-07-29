package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.recommendation.CreateRecommendation;
import to.bconnect.api.core.domain.recommendation.Recommendation;
import to.bconnect.api.storage.recommendation.RecommendationEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class RecommendationFactory {

    public static Recommendation domain(Long id, Long memberId) {
        return new Recommendation(id, memberId, "content", false,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static RecommendationEntity entity(Long fromId, Long toId) {
        return new RecommendationEntity(fromId, toId, "content");
    }

    public static CreateRecommendation command(Long toId) {
        return new CreateRecommendation(toId, "content");
    }
}
