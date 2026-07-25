package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletRequest;
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
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.member.MemberService;
import to.bconnect.api.core.presentation.v1.request.RegisterMemberRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateMemberRequest;
import to.bconnect.api.core.presentation.v1.request.UpdatePictureRequest;
import to.bconnect.api.core.presentation.v1.response.CheckUsernameResponse;
import to.bconnect.api.core.presentation.v1.response.MemberResponse;
import to.bconnect.api.core.presentation.v1.response.RegisterMemberResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.session.SessionTokenIssuer;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;
    private final SessionTokenIssuer sessionTokenIssuer;

    @GetMapping("/me")
    public ApiResponse<MemberResponse> get(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val member = memberService.get(user);
        val picture = attachmentUrlService.get(ReferenceType.MEMBER, member.id(), ImageSize.SMALL);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(MemberResponse.of(member, picture));
    }

    @GetMapping
    public ApiResponse<CursorPage<MemberResponse>> list(
            CursorLimit cursorLimit,
            HttpServletResponse response) {
        val page = memberService.list(cursorLimit);
        val members = page.content();
        val urlMap = attachmentUrlService.map(
                ReferenceType.MEMBER, members.stream().map(Member::id).toList(), ImageSize.SMALL);

        val content = members.stream()
                .map(it -> MemberResponse.of(it, urlMap.get(it.id())))
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(new CursorPage<>(content, page.hasNext(), page.nextCursor()));
    }

    @GetMapping("/check-username")
    public ApiResponse<CheckUsernameResponse> checkUsername(@RequestParam String username) {
        val available = memberService.checkUsername(username);
        return ApiResponse.success(new CheckUsernameResponse(available));
    }

    @PostMapping
    public ApiResponse<RegisterMemberResponse> register(
            @AuthenticationPrincipal String phone,
            @RequestBody @Valid RegisterMemberRequest body,
            HttpServletRequest request,
            HttpServletResponse response) {
        val member = memberService.register(phone, body.toCommand());
        val session = sessionTokenIssuer.login(member.id(), member.username(), member.role().name(), request, response);

        return ApiResponse.success(new RegisterMemberResponse(member.id(), session.accessToken()));
    }

    @PutMapping("/me")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid UpdateMemberRequest request) {
        memberService.update(user, request.toCommand());
        return ApiResponse.success(null);
    }

    @PutMapping("/me/picture")
    public ApiResponse<Void> updatePicture(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody UpdatePictureRequest request) {
        memberService.updatePicture(user, request.pictureId());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> withdraw(@AuthenticationPrincipal AuthUser user) {
        memberService.withdraw(user);
        return ApiResponse.success(null);
    }
}
