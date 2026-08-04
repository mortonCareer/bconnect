package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
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
import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.core.domain.coworker.CoworkerService;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.core.domain.task.TaskQueryService;
import to.bconnect.api.core.presentation.v1.response.CoworkerResponse;
import to.bconnect.api.core.presentation.v1.response.CoworkerTaskResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coworkers")
@RequiredArgsConstructor
public class CoworkerController {

    private final CoworkerService coworkerService;
    private final TaskQueryService taskQueryService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<List<CoworkerResponse>> list(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam Long memberId,
            HttpServletResponse response) {
        val coworkers = coworkerService.list(memberId);
        val memberIds = coworkers.stream().map(Coworker::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val profileMap = profileResolver.resolveMap(memberIds);
        val statusMap = coworkerService.resolveStatusMap(user.id(), memberIds);
        val urlMap = attachmentUrlService.map(AttachmentReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val body = coworkers.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return CoworkerResponse.of(
                            it,
                            member,
                            profileMap.get(it.memberId()),
                            statusMap.get(it.memberId()),
                            urlMap.get(member.id()));
                })
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
    }

    @GetMapping("/{memberId}/tasks")
    public ApiResponse<List<CoworkerTaskResponse>> listTasks(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long memberId) {
        val body = taskQueryService.listByCoworker(user, memberId).stream()
                .map(CoworkerTaskResponse::of)
                .toList();
        return ApiResponse.success(body);
    }

    @DeleteMapping("/{memberId}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long memberId) {
        coworkerService.delete(user, memberId);
        return ApiResponse.success(null);
    }
}
