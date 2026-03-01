package so.morton.api.api.controller.v1;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.request.CreateCoworkerRequest;
import so.morton.api.domain.coworker.CoworkerRequestService;
import so.morton.api.domain.coworker.CoworkerRequest;
import so.morton.api.support.auth.User;
import so.morton.api.support.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/coworker-requests")
@RequiredArgsConstructor
public class CoworkerRequestController {

    private final CoworkerRequestService coworkerRequestService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreateCoworkerRequest request) {
        CoworkerRequest coworkerRequest = coworkerRequestService.create(user, request.toId());
        return ApiResponse.success(coworkerRequest.id());
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        coworkerRequestService.accept(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        coworkerRequestService.deny(user, id);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancel(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        coworkerRequestService.cancel(user, id);
        return ApiResponse.success(null);
    }
}
