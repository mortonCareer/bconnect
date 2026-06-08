package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.request.CreateCoworkerRequest;
import to.bconnect.api.core.presentation.v1.response.CoworkerRequestResponse;
import to.bconnect.api.core.domain.coworker.CoworkerRequestService;
import to.bconnect.api.core.domain.coworker.CoworkerRequest;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coworker-requests")
@RequiredArgsConstructor
public class CoworkerRequestController {

    private final CoworkerRequestService coworkerRequestService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateCoworkerRequest request) {
        CoworkerRequest coworkerRequest = coworkerRequestService.create(user, request.toId());
        return ApiResponse.success(coworkerRequest.id());
    }

    @GetMapping("/received")
    public ApiResponse<List<CoworkerRequestResponse>> listReceived(
            @AuthenticationPrincipal AuthUser user) {
        List<CoworkerRequestResponse> requests = coworkerRequestService.listReceived(user).stream()
                .map(CoworkerRequestResponse::of)
                .toList();
        return ApiResponse.success(requests);
    }

    @GetMapping("/sent")
    public ApiResponse<List<CoworkerRequestResponse>> listSent(
            @AuthenticationPrincipal AuthUser user) {
        List<CoworkerRequestResponse> requests = coworkerRequestService.listSent(user).stream()
                .map(CoworkerRequestResponse::of)
                .toList();
        return ApiResponse.success(requests);
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
}
