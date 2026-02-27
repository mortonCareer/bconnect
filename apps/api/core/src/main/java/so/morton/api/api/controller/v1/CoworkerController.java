package so.morton.api.api.controller.v1;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.request.CreateCoworkerRequest;
import so.morton.api.api.controller.v1.response.CoworkerResponse;
import so.morton.api.domain.coworker.CoworkerService;
import so.morton.api.support.auth.User;
import so.morton.api.support.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/co-workers")
@RequiredArgsConstructor
public class CoworkerController {

    private final CoworkerService coworkerService;

    @GetMapping
    public ApiResponse<List<CoworkerResponse>> get(
            @RequestParam Long profileId,
            @AuthenticationPrincipal User user) {

        List<CoworkerResponse> coworkers = coworkerService.get(user, profileId).stream()
                .map(CoworkerResponse::of)
                .toList();
        return ApiResponse.success(coworkers);
    }

    @PostMapping
    public ApiResponse<Void> create(
            @AuthenticationPrincipal User user,
            @RequestBody CreateCoworkerRequest request) {
        coworkerService.create(user, request.toId());
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        coworkerService.accept(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        coworkerService.deny(user, id);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        coworkerService.delete(user, id);
        return ApiResponse.success(null);
    }
}
