package so.morton.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import so.morton.api.api.controller.v1.request.CreateCredentialRequest;
import so.morton.api.api.controller.v1.response.CredentialResponse;
import so.morton.api.domain.credential.Credential;
import so.morton.api.domain.credential.CredentialService;
import so.morton.api.support.auth.User;
import so.morton.api.support.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final CredentialService credentialService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreateCredentialRequest request) {
        Credential saved = credentialService.create(user, request);
        return ApiResponse.success(saved.id());
    }

    @GetMapping
    public ApiResponse<List<CredentialResponse>> get(@RequestParam Long profileId) {
        List<CredentialResponse> credentials = credentialService.get(profileId).stream()
                .map(CredentialResponse::of)
                .toList();
        return ApiResponse.success(credentials);
    }

    @PutMapping("/{id}")
    public ApiResponse<Long> renew(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        Credential saved = credentialService.renew(user, id);
        return ApiResponse.success(saved.id());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        credentialService.delete(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/accept")

    public ApiResponse<Void> accept(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        credentialService.accept(id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        credentialService.deny(id);
        return ApiResponse.success(null);
    }
}