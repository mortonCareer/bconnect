package to.bconnect.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import to.bconnect.api.api.controller.v1.request.CreateCredentialRequest;
import to.bconnect.api.api.controller.v1.response.CredentialResponse;
import to.bconnect.api.domain.credential.Credential;
import to.bconnect.api.domain.credential.CredentialService;
import to.bconnect.api.support.security.User;
import to.bconnect.api.storage.common.value.CredentialType;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;

    @GetMapping("/types")
    public ApiResponse<CredentialType[]> listTypes() {
        return ApiResponse.success(CredentialType.values());
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
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreateCredentialRequest request) {
        Credential saved = credentialService.create(user, request);
        return ApiResponse.success(saved.id());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        credentialService.delete(user, id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        credentialService.accept(id);
        return ApiResponse.success(null);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        credentialService.deny(id);
        return ApiResponse.success(null);
    }
}
