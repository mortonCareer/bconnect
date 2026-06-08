package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import to.bconnect.api.core.presentation.v1.request.CreateCredentialRequest;
import to.bconnect.api.core.presentation.v1.response.CredentialResponse;
import to.bconnect.api.core.domain.credential.Credential;
import to.bconnect.api.core.domain.credential.CredentialService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.core.storage.credential.CredentialType;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;

    @GetMapping("/types")
    public ApiResponse<List<CredentialType>> listTypes() {
        return ApiResponse.success(List.of(CredentialType.values()));
    }

    @GetMapping
    public ApiResponse<List<CredentialResponse>> list(@RequestParam Long profileId) {
        List<CredentialResponse> credentials = credentialService.list(profileId).stream()
                .map(CredentialResponse::of)
                .toList();
        return ApiResponse.success(credentials);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody @Valid CreateCredentialRequest request) {
        Credential saved = credentialService.create(authUser, request);
        return ApiResponse.success(saved.id());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id) {
        credentialService.delete(authUser, id);
        return ApiResponse.success(null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id) {
        credentialService.accept(id);
        return ApiResponse.success(null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id) {
        credentialService.deny(id);
        return ApiResponse.success(null);
    }
}
