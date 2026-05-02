package so.morton.api.support.fixture;

import so.morton.api.api.controller.v1.request.CreateRecommendationRequest;
import so.morton.api.api.controller.v1.request.UpdateRecommendationRequest;
import so.morton.api.domain.recommendation.Recommendation;
import so.morton.api.storage.domain.recommendation.RecommendationEntity;

import java.time.LocalDateTime;

public class RecommendationFactory {

    public static Recommendation create(Long id, Long fromId, Long toId) {
        return new Recommendation(id, fromId, toId, "content", false,
                LocalDateTime.MIN, LocalDateTime.MIN);
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
