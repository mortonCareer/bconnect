package so.morton.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.request.RegisterMemberRequest;
import so.morton.api.api.controller.v1.request.UpdateMemberRequest;
import so.morton.api.api.controller.v1.response.MemberResponse;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.member.MemberService;
import so.morton.api.support.auth.User;
import so.morton.api.support.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @PostMapping
    public ApiResponse<MemberResponse> register(@RequestBody @Valid RegisterMemberRequest request) {
        Member member = memberService.register(request);
        return ApiResponse.success(MemberResponse.of(member));
    }

    @GetMapping("/me")
    public ApiResponse<MemberResponse> getMe(@AuthenticationPrincipal User user) {
        Member member = memberService.get(user.id());
        return ApiResponse.success(MemberResponse.of(member));
    }

    @PutMapping("/me")
    public ApiResponse<MemberResponse> updateMe(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdateMemberRequest request) {
        Member member = memberService.update(user.id(), request);
        return ApiResponse.success(MemberResponse.of(member));
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> deleteMe(@AuthenticationPrincipal User user) {
        memberService.delete(user.id());
        return ApiResponse.success(null);
    }
}
