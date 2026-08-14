package to.bconnect.api.oneclick.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.oneclick.domain.OneClickService;
import to.bconnect.api.oneclick.presentation.v1.request.OneClickRequest;
import to.bconnect.api.oneclick.presentation.v1.request.ValidateBusinessRequest;
import to.bconnect.api.oneclick.presentation.v1.response.OneClickResponse;
import to.bconnect.api.security.AuthUser;

@RestController
@RequestMapping("/api/v1/one-click")
@RequiredArgsConstructor
// 원클릭 조회 컨트롤러
public class OneClickController {

    private final OneClickService oneClickService;

    @PostMapping
    public ApiResponse<OneClickResponse> lookup(@RequestBody @Valid OneClickRequest request) {
        val result = oneClickService.lookup(request.brn());
        return ApiResponse.success(OneClickResponse.of(result));
    }

    @PostMapping("/validation")
    public ApiResponse<Void> validate(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid ValidateBusinessRequest request) {
        oneClickService.validate(user, request.toCommand());
        return ApiResponse.success(null);
    }
}
