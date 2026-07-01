package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
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
import to.bconnect.api.attachment.AttachmentResolver;
import to.bconnect.api.attachment.ImageSize;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.core.domain.recommendation.Recommendation;
import to.bconnect.api.core.domain.recommendation.RecommendationQueryService;
import to.bconnect.api.core.domain.recommendation.RecommendationService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final RecommendationQueryService recommendationQueryService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentResolver attachmentResolver;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateRecommendationRequest request) {
        val id = recommendationService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @GetMapping("/received")
    public ApiResponse<List<RecommendationResponse>> listReceived(@RequestParam Long memberId) {
        val recommendations = recommendationQueryService.listReceived(memberId);
        return ApiResponse.success(assemble(recommendations));
    }

    @GetMapping("/sent")
    public ApiResponse<List<RecommendationResponse>> listSent(@RequestParam Long memberId) {
        val recommendations = recommendationQueryService.listSent(memberId);
        return ApiResponse.success(assemble(recommendations));
    }

    @GetMapping("/me/received")
    public ApiResponse<List<RecommendationResponse>> listMyReceived(
            @AuthenticationPrincipal AuthUser user) {
        val recommendations = recommendationQueryService.listMyReceived(user);
        return ApiResponse.success(assemble(recommendations));
    }

    @GetMapping("/me/sent")
    public ApiResponse<List<RecommendationResponse>> listMySent(
            @AuthenticationPrincipal AuthUser user) {
        val recommendations = recommendationQueryService.listMySent(user);
        return ApiResponse.success(assemble(recommendations));
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @RequestBody @Valid UpdateRecommendationRequest request) {
        recommendationService.update(user, id, request.content());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        recommendationService.delete(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/hide")
    public ApiResponse<Void> hide(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        recommendationService.hide(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/show")
    public ApiResponse<Void> show(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        recommendationService.show(user, id);
        return ApiResponse.success(null);
    }

    private List<RecommendationResponse> assemble(List<Recommendation> recommendations) {
        val memberIds = recommendations.stream().map(Recommendation::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val profileMap = profileResolver.resolveMap(memberIds);
        val urlMap = attachmentResolver.resolveUrlMap(ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        return recommendations.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return RecommendationResponse.of(
                            it,
                            member,
                            profileMap.get(it.memberId()),
                            urlMap.get(member.id()));
                })
                .toList();
    }
}
