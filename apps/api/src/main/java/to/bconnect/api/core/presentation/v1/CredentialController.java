package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.AttachmentKeyUtils;
import to.bconnect.api.attachment.domain.AttachmentResolver;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.core.domain.credential.CredentialService;
import to.bconnect.api.core.presentation.v1.request.CreateCredentialRequest;
import to.bconnect.api.core.presentation.v1.response.CredentialResponse;
import to.bconnect.api.core.presentation.v1.response.CredentialSummaryResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.support.cloudfront.SignedCookieIssuer;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;
    private final AttachmentResolver attachmentResolver;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<List<CredentialSummaryResponse>> list(@RequestParam Long memberId) {
        val body = credentialService.listLatestAccepted(memberId).stream()
                .map(CredentialSummaryResponse::of)
                .toList();
        return ApiResponse.success(body);
    }

    @GetMapping("/me")
    public ApiResponse<List<CredentialResponse>> listMine(
            @AuthenticationPrincipal AuthUser user,
            HttpServletResponse response) {
        val credentials = credentialService.list(user.id());

        val credentialIds = credentials.stream()
                .map(Credential::id)
                .toList();
        val attachmentMap = attachmentResolver.resolveMap(ReferenceType.CREDENTIAL, credentialIds);

        val body = credentials.stream()
                .map(it -> {
                    val attachment = attachmentMap.get(it.id());
                    val url = attachmentResolver.parseUrl(attachment, ImageSize.SMALL);
                    return CredentialResponse.of(it, attachment, url);
                })
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.CREDENTIAL, user.id());
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
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
