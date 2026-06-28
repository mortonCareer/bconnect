package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.request.CreateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileAboutRequest;
import to.bconnect.api.core.presentation.v1.response.ProfileResponse;
import to.bconnect.api.attachment.AttachmentResolver;
import to.bconnect.api.attachment.ImageSize;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileQueryService;
import to.bconnect.api.core.domain.profile.ProfileService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final ProfileQueryService profileQueryService;
    private final MemberResolver memberResolver;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<List<ProfileResponse>> list() {
        val profiles = profileQueryService.list();

        val memberIds = profiles.stream().map(Profile::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val urlMap = attachmentResolver.resolveUrlMap(
                memberMap.values().stream().map(Member::pictureId).toList(), ImageSize.SMALL);

        val response = profiles.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return ProfileResponse.of(it, member, urlMap.get(member.pictureId()));
                })
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProfileResponse> get(@PathVariable Long id) {
        val profile = profileQueryService.get(id);
        val member = memberResolver.find(profile.memberId());

        return ApiResponse.success(
                ProfileResponse.of(profile, member, attachmentResolver.getUrl(member.pictureId(), ImageSize.SMALL)));
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateProfileRequest request) {
        val id = profileService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @PutMapping("/me")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid UpdateProfileRequest request) {
        profileService.update(user, request.toCommand());
        return ApiResponse.success(null);
    }

    @PutMapping("/me/about")
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
