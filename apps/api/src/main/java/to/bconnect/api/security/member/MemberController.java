package to.bconnect.api.security.member;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.AttachmentResolver;
import to.bconnect.api.attachment.ImageSize;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final AttachmentResolver attachmentResolver;

    @GetMapping("/me")
    public ApiResponse<MemberResponse> get(@AuthenticationPrincipal AuthUser user) {
        val member = memberService.get(user);
        return ApiResponse.success(MemberResponse.of(member, attachmentResolver.getUrl(member.pictureId(), ImageSize.SMALL)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ApiResponse<List<MemberResponse>> listMembers() {
        val members = memberService.list();
        val urlMap = attachmentResolver.resolveUrlMap(members.stream().map(Member::pictureId).toList(), ImageSize.SMALL);

        val response = members.stream()
                .map(it -> MemberResponse.of(it, urlMap.get(it.pictureId())))
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/check-username")
    public ApiResponse<CheckUsernameResponse> checkUsername(@RequestParam String username) {
        val available = memberService.checkUsername(username);
        return ApiResponse.success(new CheckUsernameResponse(available));
    }

    @PostMapping
    public ApiResponse<Long> register(@RequestBody @Valid RegisterMemberRequest request) {
        val member = memberService.register(request.toCommand());
        return ApiResponse.success(member.id());
    }

    @PutMapping("/me")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid UpdateMemberRequest request) {
        memberService.update(user, request.toCommand());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> withdraw(@AuthenticationPrincipal AuthUser user) {
        memberService.withdraw(user);
        return ApiResponse.success(null);
    }
}
