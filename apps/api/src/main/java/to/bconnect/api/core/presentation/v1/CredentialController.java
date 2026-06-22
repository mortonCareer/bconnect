package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import to.bconnect.api.core.presentation.v1.request.CreateCredentialRequest;
import to.bconnect.api.core.presentation.v1.response.CredentialResponse;
import to.bconnect.api.core.presentation.v1.response.CredentialSummaryResponse;
import to.bconnect.api.core.domain.attachment.Attachment;
import to.bconnect.api.core.domain.attachment.AttachmentResolver;
import to.bconnect.api.core.domain.attachment.ImageSize;
import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.core.domain.credential.CredentialService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<List<CredentialSummaryResponse>> list(@RequestParam Long memberId) {
        List<CredentialSummaryResponse> response = credentialService.listPublic(memberId).stream()
                .map(CredentialSummaryResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/me")
    public ApiResponse<List<CredentialResponse>> listMine(@AuthenticationPrincipal AuthUser user) {
        List<Credential> credentials = credentialService.list(user.id());

        List<Long> attachmentIds = credentials.stream()
                .map(Credential::attachmentId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, Attachment> attachmentMap = attachmentResolver.resolveMap(attachmentIds);

        List<CredentialResponse> response = credentials.stream()
                .map(it -> {
                    Attachment attachment = attachmentMap.get(it.attachmentId());
                    return CredentialResponse.of(it, attachment, attachmentResolver.url(attachment, ImageSize.SMALL));
                })
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateCredentialRequest request) {
        Long id = credentialService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        credentialService.delete(user, id);
        return ApiResponse.success(null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        credentialService.accept(id);
        return ApiResponse.success(null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        credentialService.deny(id);
        return ApiResponse.success(null);
    }
}
