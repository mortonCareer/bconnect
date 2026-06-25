package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.core.presentation.v1.request.CreateCoworkerRequest;
import to.bconnect.api.core.presentation.v1.response.CoworkerRequestResponse;
import to.bconnect.api.core.domain.attachment.AttachmentResolver;
import to.bconnect.api.core.domain.attachment.ImageSize;
import to.bconnect.api.core.domain.coworker.CoworkerRequestQueryService;
import to.bconnect.api.core.domain.coworker.CoworkerRequestService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileQueryService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/coworker-requests")
@RequiredArgsConstructor
public class CoworkerRequestController {

    private final CoworkerRequestService coworkerRequestService;
    private final CoworkerRequestQueryService coworkerRequestQueryService;
    private final MemberResolver memberResolver;
    private final ProfileQueryService profileQueryService;
    private final AttachmentResolver attachmentResolver;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateCoworkerRequest request) {
        val id = coworkerRequestService.create(user, request.toId());
        return ApiResponse.success(id);
    }

    @GetMapping("/received")
    public ApiResponse<List<CoworkerRequestResponse>> listReceived(
            @AuthenticationPrincipal AuthUser user) {
        return ApiResponse.success(assemble(coworkerRequestQueryService.listReceived(user)));
    }

    @GetMapping("/sent")
    public ApiResponse<List<CoworkerRequestResponse>> listSent(
            @AuthenticationPrincipal AuthUser user) {
        return ApiResponse.success(assemble(coworkerRequestQueryService.listSent(user)));
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        coworkerRequestService.accept(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        coworkerRequestService.deny(user, id);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancel(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        coworkerRequestService.cancel(user, id);
        return ApiResponse.success(null);
    }

    private List<CoworkerRequestResponse> assemble(List<CoworkerRequest> requests) {
        val memberIds = requests.stream().map(CoworkerRequest::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val profileMap = profileQueryService.resolveMap(memberIds);

        val pictureIds = profileMap.values().stream()
                .map(Profile::pictureId).filter(Objects::nonNull).toList();
        val attachmentMap = attachmentResolver.resolveMap(pictureIds);

        return requests.stream()
                .map(it -> {
                    val profile = profileMap.get(it.memberId());
                    return CoworkerRequestResponse.of(
                            it,
                            memberMap.get(it.memberId()),
                            profile,
                            profile == null ? null : attachmentResolver.url(attachmentMap.get(profile.pictureId()), ImageSize.SMALL));
                })
                .toList();
    }
}
