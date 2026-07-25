package to.bconnect.api.core.presentation.v1;

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
import to.bconnect.api.core.domain.coworker.CoworkerService;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileQueryService;
import to.bconnect.api.core.domain.profile.ProfileService;
import to.bconnect.api.core.presentation.v1.request.CreateProfileRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileAboutRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProfileRequest;
import to.bconnect.api.core.presentation.v1.response.ProfileDetailResponse;
import to.bconnect.api.core.presentation.v1.response.ProfileResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.coworker.CoworkerStatus;

@RestController
@RequestMapping("/api/v1/profiles")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final ProfileQueryService profileQueryService;
    private final CoworkerService coworkerService;
    private final MemberResolver memberResolver;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<CursorPage<ProfileResponse>> list(
            CursorLimit cursorLimit,
            HttpServletResponse response) {
        val page = profileQueryService.list(cursorLimit);
        val profiles = page.content();

        val memberIds = profiles.stream().map(Profile::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val urlMap = attachmentUrlService.map(ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val content = profiles.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return ProfileResponse.of(it, member, urlMap.get(member.id()));
                })
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(new CursorPage<>(content, page.hasNext(), page.nextCursor()));
    }

    @GetMapping("/me")
    public ApiResponse<ProfileResponse> getMine(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val profile = profileQueryService.get(user.id());
        val member = memberResolver.get(profile.memberId());
        val picture = attachmentUrlService.get(ReferenceType.MEMBER, member.id(), ImageSize.SMALL);

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(ProfileResponse.of(profile, member, picture));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProfileDetailResponse> get(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            HttpServletResponse response) {
        val profile = profileQueryService.get(id);
        val member = memberResolver.get(profile.memberId());
        val picture = attachmentUrlService.get(ReferenceType.MEMBER, member.id(), ImageSize.SMALL);
        val status = user == null
                ? CoworkerStatus.NONE
                : coworkerService.resolveStatus(user.id(), profile.memberId());

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(ProfileDetailResponse.of(profile, member, picture, status));
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
            @RequestBody @Valid UpdateProfileAboutRequest request) {
        profileService.updateAbout(user, request.about());
        return ApiResponse.success(null);
    }
}
