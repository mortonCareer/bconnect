package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.retention.RetentionHoldService;
import to.bconnect.api.core.presentation.v1.request.CreateRetentionHoldRequest;
import to.bconnect.api.core.presentation.v1.response.RetentionHoldResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/retention-holds")
@RequiredArgsConstructor
public class RetentionHoldController {

    private final RetentionHoldService retentionHoldService;

    @GetMapping
    public ApiResponse<List<RetentionHoldResponse>> list(@RequestParam Long memberId) {
        var body = retentionHoldService.list(memberId).stream()
                .map(RetentionHoldResponse::of)
                .toList();
        return ApiResponse.success(body);
    }

    @PostMapping
    public ApiResponse<Long> create(@RequestBody @Valid CreateRetentionHoldRequest request) {
        return ApiResponse.success(retentionHoldService.create(request.toCommand()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> release(@PathVariable Long id) {
        retentionHoldService.release(id);
        return ApiResponse.success(null);
    }
}
