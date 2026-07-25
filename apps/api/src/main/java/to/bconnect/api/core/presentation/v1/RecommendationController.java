package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.AttachmentKeyUtils;
import to.bconnect.api.attachment.domain.AttachmentUrlService;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.attachment.domain.SignedCookieIssuer;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.core.domain.recommendation.Recommendation;
import to.bconnect.api.core.domain.recommendation.RecommendationQueryService;
import to.bconnect.api.core.domain.recommendation.RecommendationService;
import to.bconnect.api.core.presentation.v1.request.CreateRecommendationRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateRecommendationRequest;
import to.bconnect.api.core.presentation.v1.response.RecommendationResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final RecommendationQueryService recommendationQueryService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateRecommendationRequest request) {
        val id = recommendationService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @GetMapping("/received")
    public ApiResponse<List<RecommendationResponse>> listReceived(
            @RequestParam Long memberId,
            HttpServletResponse response) {
        val recommendations = recommendationQueryService.listReceived(memberId);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(assemble(recommendations));
    }

    @GetMapping("/sent")
    public ApiResponse<List<RecommendationResponse>> listSent(
            @RequestParam Long memberId,
            HttpServletResponse response) {
        val recommendations = recommendationQueryService.listSent(memberId);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(assemble(recommendations));
    }

    @GetMapping("/me/received")
    public ApiResponse<List<RecommendationResponse>> listMyReceived(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val recommendations = recommendationQueryService.listMyReceived(user);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(assemble(recommendations));
    }

    @GetMapping("/me/sent")
    public ApiResponse<List<RecommendationResponse>> listMySent(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val recommendations = recommendationQueryService.listMySent(user);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

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
        val urlMap = attachmentUrlService.map(ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

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
