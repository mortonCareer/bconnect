package so.morton.api.api.controller.v1;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
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
import so.morton.api.api.controller.v1.response.RegisterMemberResponse;
import so.morton.api.config.AppProperties;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.member.MemberService;
import so.morton.api.support.auth.User;
import so.morton.api.support.auth.jwt.JwtProvider;
import so.morton.api.support.auth.jwt.RefreshTokenCookieUtils;
import so.morton.api.support.auth.otp.OtpService;
import so.morton.api.support.auth.otp.SessionService;
import so.morton.api.support.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final JwtProvider jwtProvider;
    private final SessionService sessionService;
    private final OtpService otpService;
    private final AppProperties appProperties;
    private final Environment environment;

    @GetMapping("/me")
    public ApiResponse<MemberResponse> get(@AuthenticationPrincipal User user) {
        Member member = memberService.get(user);
        return ApiResponse.success(MemberResponse.of(member));
    }

    @PostMapping
    public ApiResponse<RegisterMemberResponse> register(
            @RequestBody @Valid RegisterMemberRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        otpService.verifyToken(request.signupToken());
        Member member = memberService.register(request);

        String accessToken = jwtProvider.generateAccessToken(
                new so.morton.api.support.auth.User(member.id(), member.username(), member.role().name()));
        String refreshToken = jwtProvider.generateRefreshToken(member.username());
        String agent = httpRequest.getHeader("User-Agent") != null ? httpRequest.getHeader("User-Agent") : "";
        String ip = httpRequest.getRemoteAddr() != null ? httpRequest.getRemoteAddr() : "";
        sessionService.login(member.username(), agent, ip, refreshToken);

        boolean isSecure = !environment.matchesProfiles("local");
        RefreshTokenCookieUtils.addRefreshTokenCookie(
                httpResponse, refreshToken, appProperties.jwt().refreshTokenExpiration(), isSecure);

        return ApiResponse.success(new RegisterMemberResponse(member.id(), accessToken));
    }

    @PutMapping("/me")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdateMemberRequest request) {
        memberService.update(user, request);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> withdraw(@AuthenticationPrincipal User user) {
        memberService.withdraw(user);
        return ApiResponse.success(null);
    }
}
