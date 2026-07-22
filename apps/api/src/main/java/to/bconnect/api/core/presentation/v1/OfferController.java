package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.offer.OfferService;
import to.bconnect.api.core.presentation.v1.request.CreateOfferRequest;
import to.bconnect.api.core.presentation.v1.request.ReorderOfferRequest;
import to.bconnect.api.security.AuthUser;

@RestController
@RequestMapping("/api/v1/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateOfferRequest request) {
        val offerId = offerService.create(user, request.toCommand());
        return ApiResponse.success(offerId);
    }

    @PutMapping("/reorder")
    public ApiResponse<Void> reorder(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid ReorderOfferRequest request) {
        offerService.reorder(user, request.offerIds());
        return ApiResponse.success(null);
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

    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancel(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        offerService.cancel(user, id);
        return ApiResponse.success(null);
    }
}
