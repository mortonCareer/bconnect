package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.request.CreateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileAboutRequest;
import to.bconnect.api.core.presentation.v1.response.ProfileResponse;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileQueryService;
import to.bconnect.api.core.domain.profile.ProfileService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final ProfileQueryService profileQueryService;
    private final MemberResolver memberResolver;

    @GetMapping
    public ApiResponse<List<ProfileResponse>> list() {
        List<Profile> profiles = profileQueryService.list();

        List<Long> memberIds = profiles.stream().map(Profile::memberId).distinct().toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);

        List<ProfileResponse> response = profiles.stream()
                .map(it -> ProfileResponse.of(it, memberMap.get(it.memberId())))
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProfileResponse> get(@PathVariable Long id) {
        Profile profile = profileQueryService.get(id);
        Member member = memberResolver.find(profile.memberId());
        return ApiResponse.success(ProfileResponse.of(profile, member));
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateProfileRequest request) {
        Long id = profileService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @PutMapping("/me")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid UpdateProfileRequest request) {
        profileService.update(user, request.toCommand());
        return ApiResponse.success(null);
    }

    @PatchMapping("/me/about")
    public ApiResponse<Void> updateAbout(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody UpdateProfileAboutRequest request) {
        profileService.updateAbout(user, request.about());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user) {
        profileService.delete(user);
        return ApiResponse.success(null);
    }
}
