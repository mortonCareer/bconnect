package to.bconnect.api.core.presentation.v1;

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
import to.bconnect.api.core.presentation.v1.request.CreateRecommendationRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateRecommendationRequest;
import to.bconnect.api.core.presentation.v1.response.RecommendationResponse;
import to.bconnect.api.core.domain.recommendation.Recommendation;
import to.bconnect.api.core.domain.recommendation.RecommendationService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody @Valid CreateRecommendationRequest request) {
        Recommendation recommendation = recommendationService.create(authUser, request);
        return ApiResponse.success(recommendation.id());
    }

    @GetMapping("/received")
    public ApiResponse<List<RecommendationResponse>> listReceived(@RequestParam Long profileId) {
        List<RecommendationResponse> responses = recommendationService.listReceived(profileId).stream()
                .map(RecommendationResponse::of)
                .toList();
        return ApiResponse.success(responses);
    }

    @GetMapping("/sent")
    public ApiResponse<List<RecommendationResponse>> listSent(@RequestParam Long profileId) {
        List<RecommendationResponse> responses = recommendationService.listSent(profileId).stream()
                .map(RecommendationResponse::of)
                .toList();
        return ApiResponse.success(responses);
    }

    @GetMapping("/me/received")
    public ApiResponse<List<RecommendationResponse>> listMyReceived(
            @AuthenticationPrincipal AuthUser authUser) {
        List<RecommendationResponse> responses = recommendationService.listMyReceived(authUser).stream()
                .map(RecommendationResponse::of)
                .toList();
        return ApiResponse.success(responses);
    }

    @GetMapping("/me/sent")
    public ApiResponse<List<RecommendationResponse>> listMySent(
            @AuthenticationPrincipal AuthUser authUser) {
        List<RecommendationResponse> responses = recommendationService.listMySent(authUser).stream()
                .map(RecommendationResponse::of)
                .toList();
        return ApiResponse.success(responses);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id,
            @RequestBody @Valid UpdateRecommendationRequest request) {
        recommendationService.update(authUser, id, request.content());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id) {
        recommendationService.delete(authUser, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/hide")
    public ApiResponse<Void> hide(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id) {
        recommendationService.hide(authUser, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/show")
    public ApiResponse<Void> show(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id) {
        recommendationService.show(authUser, id);
        return ApiResponse.success(null);
    }
}
