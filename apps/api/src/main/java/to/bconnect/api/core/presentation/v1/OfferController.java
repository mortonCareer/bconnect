package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.offer.OfferService;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.TaskQueryService;
import to.bconnect.api.core.presentation.v1.request.CreateOfferRequest;
import to.bconnect.api.core.presentation.v1.response.OfferResponse;
import to.bconnect.api.core.presentation.v1.response.TaskResponse;
import to.bconnect.api.security.AuthUser;

@RestController
@RequestMapping("/api/v1/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;
    private final TaskQueryService taskQueryService;
    private final ProjectService projectService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateOfferRequest request) {
        val id = offerService.create(user, request.toCommand());
        // TODO : Offer 메시지 전송
        return ApiResponse.success(id);
    }

    @GetMapping("/{id}")
    public ApiResponse<OfferResponse> get(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        val offer = offerService.get(user, id);
        val task = taskQueryService.get(user, offer.taskId());
        val address = projectService.get(task.projectId()).address();
        return ApiResponse.success(OfferResponse.of(offer, TaskResponse.of(task, address)));
    }

    @PostMapping("/{id}/accept")
    public ApiResponse<Void> accept(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        offerService.accept(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/{id}/deny")
    public ApiResponse<Void> deny(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        offerService.deny(user, id);
        return ApiResponse.success(null);
    }
}
