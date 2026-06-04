package to.bconnect.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.api.controller.v1.request.RegisterMemberRequest;
import to.bconnect.api.api.controller.v1.request.UpdateMemberRequest;
import to.bconnect.api.api.controller.v1.response.CheckUsernameResponse;
import to.bconnect.api.api.controller.v1.response.MemberResponse;
import to.bconnect.api.domain.member.Member;
import to.bconnect.api.domain.member.MemberService;
import to.bconnect.api.support.security.User;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @GetMapping("/me")
    public ApiResponse<MemberResponse> get(@AuthenticationPrincipal User user) {
        Member member = memberService.get(user);
        return ApiResponse.success(MemberResponse.of(member));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ApiResponse<List<MemberResponse>> listMembers() {
        List<MemberResponse> members = memberService.getAll().stream()
                .map(MemberResponse::of)
                .toList();
        return ApiResponse.success(members);
    }

    @GetMapping("/check-username")
    public ApiResponse<CheckUsernameResponse> checkUsername(@RequestParam String username) {
        boolean available = memberService.checkUsername(username);
        return ApiResponse.success(new CheckUsernameResponse(available));
    }

    @PostMapping
    public ApiResponse<Long> register(@RequestBody @Valid RegisterMemberRequest request) {
        Member member = memberService.register(request);
        return ApiResponse.success(member.id());
    }

    @PutMapping("/me")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdateMemberRequest request) {
        memberService.update(user, request);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdraw(@AuthenticationPrincipal User user) {
        memberService.withdraw(user);
    }
}
