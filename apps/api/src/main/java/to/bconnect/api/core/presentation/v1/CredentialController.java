package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import to.bconnect.api.core.presentation.v1.request.CreateCredentialRequest;
import to.bconnect.api.core.presentation.v1.response.CredentialResponse;
import to.bconnect.api.core.presentation.v1.response.CredentialSummaryResponse;
import to.bconnect.api.attachment.AttachmentResolver;
import to.bconnect.api.attachment.ImageSize;
import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.core.domain.credential.CredentialService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<List<CredentialSummaryResponse>> list(@RequestParam Long memberId) {
        val response = credentialService.listLatestAccepted(memberId).stream()
                .map(CredentialSummaryResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/me")
    public ApiResponse<List<CredentialResponse>> listMine(@AuthenticationPrincipal AuthUser user) {
        val credentials = credentialService.list(user.id());

        val credentialIds = credentials.stream()
                .map(Credential::id)
                .toList();
        val attachmentMap = attachmentResolver.resolveMap(ReferenceType.CREDENTIAL, credentialIds);

        val response = credentials.stream()
                .map(it -> {
                    val attachment = attachmentMap.get(it.id());
                    val url = attachmentResolver.parseUrl(attachment, ImageSize.SMALL);
                    return CredentialResponse.of(it, attachment, url);
                })
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateCredentialRequest request) {
        val id = credentialService.create(user, request.toCommand());
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
    public ApiResponse<Void> accept(@PathVariable Long id) {
        credentialService.accept(id);
        return ApiResponse.success(null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(@PathVariable Long id) {
        credentialService.deny(id);
        return ApiResponse.success(null);
    }
}
