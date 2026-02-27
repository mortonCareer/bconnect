package so.morton.api.api.controller.v1;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.request.CreateCoworkerRequest;
import so.morton.api.domain.coworker.CoworkerRequestService;
import so.morton.api.support.auth.User;
import so.morton.api.support.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/coworker-requests")
@RequiredArgsConstructor
public class CoworkerRequestController {

    private final CoworkerRequestService coworkerRequestService;

    @PostMapping
    public ApiResponse<Void> create(
            @AuthenticationPrincipal User user,
            @RequestBody CreateCoworkerRequest request) {
        coworkerRequestService.create(user, request.toId());
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        coworkerRequestService.accept(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        coworkerRequestService.deny(user, id);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        coworkerRequestService.cancel(user, id);
        return ApiResponse.success(null);
    }
}
