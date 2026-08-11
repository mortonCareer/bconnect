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
import to.bconnect.api.core.domain.offer.OfferQueryService;
import to.bconnect.api.core.domain.offer.OfferService;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.core.presentation.v1.request.CreateOfferRequest;
import to.bconnect.api.core.presentation.v1.request.ReorderOfferRequest;
import to.bconnect.api.core.presentation.v1.response.OfferResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;

@RestController
@RequestMapping("/api/v1/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;
    private final OfferQueryService offerQueryService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping("/{id}")
    public ApiResponse<OfferResponse> get(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            HttpServletResponse response) {
        val offer = offerQueryService.get(user, id);
        val member = memberResolver.get(offer.workerId());
        val profile = profileResolver.get(offer.workerId());
        val picture = attachmentUrlService.get(AttachmentReferenceType.MEMBER, member.id(), ImageSize.SMALL);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(OfferResponse.of(offer, member, profile, picture));
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateOfferRequest request) {
        val offerId = offerService.create(user, request.toCommand());
        return ApiResponse.success(offerId);
    }

    @PutMapping("/reorder")
    public ApiResponse<Void> reorder(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid ReorderOfferRequest request) {
        offerService.reorder(user, request.offerIds());
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        offerService.accept(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        offerService.deny(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        offerService.cancel(user, id);
        return ApiResponse.success(null);
    }
}
