package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.response.CoworkerResponse;
import to.bconnect.api.core.domain.coworker.CoworkerService;
import to.bconnect.api.storage.coworker.CoworkerStatus;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coworkers")
@RequiredArgsConstructor
public class CoworkerController {

    private final CoworkerService coworkerService;

    @GetMapping
    public ApiResponse<List<CoworkerResponse>> list(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam Long memberId) {
        // TODO: CoworkerStatus 함께 조회
        List<CoworkerResponse> coworkers = coworkerService.list(memberId).stream()
                .map(coworker -> CoworkerResponse.of(coworker, coworker.member(), CoworkerStatus.COWORKER))
                .toList();
        return ApiResponse.success(coworkers);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        coworkerService.delete(user, id);
        return ApiResponse.success(null);
    }
}
