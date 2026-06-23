package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.request.CreateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileAboutRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfilePictureRequest;
import to.bconnect.api.core.presentation.v1.response.ProfileResponse;
import to.bconnect.api.core.domain.attachment.AttachmentResolver;
import to.bconnect.api.core.domain.attachment.ImageSize;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileQueryService;
import to.bconnect.api.core.domain.profile.ProfileService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;
import java.util.Map;
import java.util.Objects;

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

        val pictureIds = profiles.stream().map(Profile::pictureId).filter(Objects::nonNull).toList();
        val attachmentMap = attachmentResolver.resolveMap(pictureIds);

        val response = profiles.stream()
                .map(it -> ProfileResponse.of(
                        it,
                        memberMap.get(it.memberId()),
                        attachmentResolver.url(attachmentMap.get(it.pictureId()), ImageSize.SMALL)))
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProfileResponse> get(@PathVariable Long id) {
        val profile = profileQueryService.get(id);
        val member = memberResolver.find(profile.memberId());

        List<Long> pictureIds = profile.pictureId() == null ? List.of() : List.of(profile.pictureId());
        val attachmentMap = attachmentResolver.resolveMap(pictureIds);
        val picture = attachmentResolver.url(attachmentMap.get(profile.pictureId()), ImageSize.SMALL);

        return ApiResponse.success(ProfileResponse.of(profile, member, picture));
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

    @PatchMapping("/me/picture")
    public ApiResponse<Void> updatePicture(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody UpdateProfilePictureRequest request) {
        profileService.updatePicture(user, request.pictureId());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/me")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user) {
        profileService.delete(user);
        return ApiResponse.success(null);
    }
}
