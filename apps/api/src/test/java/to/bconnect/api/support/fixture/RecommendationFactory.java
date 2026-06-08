package to.bconnect.api.support.fixture;

import to.bconnect.api.core.presentation.v1.request.CreateRecommendationRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateRecommendationRequest;
import to.bconnect.api.core.domain.recommendation.Recommendation;
import to.bconnect.api.storage.recommendation.RecommendationEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class RecommendationFactory {

    public static Recommendation create(Long id, Long fromId, Long toId) {
        return new Recommendation(id, fromId, toId, "content", false,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static RecommendationEntity createEntity(Long fromId, Long toId) {
        return new RecommendationEntity(fromId, toId, "content");
    }

    public static CreateRecommendationRequest createRequest(Long toId) {
        return new CreateRecommendationRequest(toId, "content");
    }

    public static UpdateRecommendationRequest updateRequest() {
        return new UpdateRecommendationRequest("Updated content");
    }
}
