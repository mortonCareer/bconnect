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
import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.core.domain.coworker.CoworkerRequestQueryService;
import to.bconnect.api.core.domain.coworker.CoworkerRequestService;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.core.presentation.v1.request.CreateCoworkerRequest;
import to.bconnect.api.core.presentation.v1.response.CoworkerRequestResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coworker-requests")
@RequiredArgsConstructor
public class CoworkerRequestController {

    private final CoworkerRequestService coworkerRequestService;
    private final CoworkerRequestQueryService coworkerRequestQueryService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateCoworkerRequest request) {
        val id = coworkerRequestService.create(user, request.toId());
        return ApiResponse.success(id);
    }

    @GetMapping("/received")
    public ApiResponse<List<CoworkerRequestResponse>> listReceived(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val requests = coworkerRequestQueryService.listReceived(user);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(assemble(requests));
    }

    @GetMapping("/sent")
    public ApiResponse<List<CoworkerRequestResponse>> listSent(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val requests = coworkerRequestQueryService.listSent(user);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(assemble(requests));
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        coworkerRequestService.accept(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        coworkerRequestService.deny(user, id);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancel(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        coworkerRequestService.cancel(user, id);
        return ApiResponse.success(null);
    }

    private List<CoworkerRequestResponse> assemble(List<CoworkerRequest> requests) {
        val memberIds = requests.stream().map(CoworkerRequest::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val profileMap = profileResolver.resolveMap(memberIds);
        val urlMap = attachmentUrlService.map(ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        return requests.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return CoworkerRequestResponse.of(
                            it,
                            member,
                            profileMap.get(it.memberId()),
                            urlMap.get(member.id()));
                })
                .toList();
    }
}
