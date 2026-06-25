package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.attachment.AttachmentResolver;
import to.bconnect.api.core.domain.attachment.AttachmentService;
import to.bconnect.api.core.domain.attachment.ImageSize;
import to.bconnect.api.core.presentation.v1.request.ConfirmRequest;
import to.bconnect.api.core.presentation.v1.request.PresignRequest;
import to.bconnect.api.core.presentation.v1.response.AttachmentResponse;
import to.bconnect.api.core.presentation.v1.response.PresignedFileResponse;
import to.bconnect.api.security.AuthUser;

import java.util.List;

@RestController
@RequestMapping("/api/v1/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final AttachmentResolver attachmentResolver;

    @PostMapping("/presign")
    public ApiResponse<List<PresignedFileResponse>> presign(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid PresignRequest request) {
        val response = attachmentService
                .presign(user, request.context(), request.type(), request.contextId(), request.toCommands()).stream()
                .map(PresignedFileResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping("/confirm")
    public ApiResponse<List<AttachmentResponse>> confirm(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid ConfirmRequest request) {
        val response = attachmentService.confirm(user, request.attachmentIds()).stream()
                .map(it -> AttachmentResponse.of(it, attachmentResolver.url(it, ImageSize.SMALL)))
                .toList();
        return ApiResponse.success(response);
    }
}
