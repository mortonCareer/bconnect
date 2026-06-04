package to.bconnect.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.api.controller.v1.request.CreateProfileRequest;
import to.bconnect.api.api.controller.v1.request.UpdateProfileRequest;
import to.bconnect.api.api.controller.v1.request.UpdateProfileAboutRequest;
import to.bconnect.api.api.controller.v1.response.ProfileResponse;
import to.bconnect.api.domain.profile.Profile;
import to.bconnect.api.domain.profile.ProfileFinder;
import to.bconnect.api.domain.profile.ProfileService;
import to.bconnect.api.support.security.User;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final ProfileFinder profileFinder;

    @GetMapping
    public ApiResponse<List<ProfileResponse>> list() {
        List<ProfileResponse> profiles = profileFinder.findAll().stream()
                .map(ProfileResponse::of)
                .toList();
        return ApiResponse.success(profiles);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProfileResponse> get(@PathVariable Long id) {
        Profile profile = profileFinder.find(id);
        return ApiResponse.success(ProfileResponse.of(profile));
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreateProfileRequest request) {
        Profile profile = profileService.create(user, request);
        return ApiResponse.success(profile.id());
    }

    @PutMapping("/me")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdateProfileRequest request) {
        profileService.update(user, request);
        return ApiResponse.success(null);
    }

    @PatchMapping("/me/about")
    public ApiResponse<Void> updateAbout(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfileAboutRequest request) {
        profileService.updateAbout(user, request.about());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal User user) {
        profileService.delete(user);
    }
}
