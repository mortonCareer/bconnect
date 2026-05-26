package so.morton.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.request.CreateRecommendationRequest;
import so.morton.api.api.controller.v1.request.UpdateRecommendationRequest;
import so.morton.api.api.controller.v1.response.RecommendationResponse;
import so.morton.api.domain.recommendation.Recommendation;
import so.morton.api.domain.recommendation.RecommendationService;
import so.morton.api.support.auth.User;
import so.morton.api.support.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreateRecommendationRequest request) {
        Recommendation recommendation = recommendationService.create(user, request);
        return ApiResponse.success(recommendation.id());
    }

    @GetMapping("/received")
    public ApiResponse<List<RecommendationResponse>> getReceived(@RequestParam Long profileId) {
        List<RecommendationResponse> responses = recommendationService.getReceived(profileId).stream()
                .map(RecommendationResponse::of)
                .toList();
        return ApiResponse.success(responses);
    }

    @GetMapping("/sent")
    public ApiResponse<List<RecommendationResponse>> getSent(@RequestParam Long profileId) {
        List<RecommendationResponse> responses = recommendationService.getSent(profileId).stream()
                .map(RecommendationResponse::of)
                .toList();
        return ApiResponse.success(responses);
    }

    @GetMapping("/me/received")
    public ApiResponse<List<RecommendationResponse>> getMyReceived(
            @AuthenticationPrincipal User user) {
        List<RecommendationResponse> responses = recommendationService.getMyReceived(user).stream()
                .map(RecommendationResponse::of)
                .toList();
        return ApiResponse.success(responses);
    }

    @GetMapping("/me/sent")
    public ApiResponse<List<RecommendationResponse>> getMySent(
            @AuthenticationPrincipal User user) {
        List<RecommendationResponse> responses = recommendationService.getMySent(user).stream()
                .map(RecommendationResponse::of)
                .toList();
        return ApiResponse.success(responses);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody @Valid UpdateRecommendationRequest request) {
        recommendationService.update(user, id, request.content());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        recommendationService.delete(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/hide")
    public ApiResponse<Void> hide(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        recommendationService.hide(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/show")
    public ApiResponse<Void> show(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        recommendationService.show(user, id);
        return ApiResponse.success(null);
    }
}
