package to.bconnect.api.attachment.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.attachment.domain.*;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.security.AuthUser;

import java.util.List;

@RestController
@RequestMapping("/api/v1/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;

    @PostMapping("/presign")
    public ApiResponse<List<PresignedFileResponse>> presign(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid PresignRequest request) {
        val body = attachmentService
                .presign(user.id(), request.context(), request.type(), request.contextId(), request.toCommands()).stream()
                .map(PresignedFileResponse::of)
                .toList();
        return ApiResponse.success(body);
    }

    @PostMapping("/confirm")
    public ApiResponse<List<AttachmentResponse>> confirm(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid ConfirmRequest request,
            HttpServletResponse response) {
        val attachments = attachmentService.confirm(user.id(), request.attachmentIds());
        val body = attachments.stream()
                .map(it -> AttachmentResponse.of(it, attachmentUrlService.parseUrl(it, ImageSize.SMALL)))
                .toList();
        val attachment = attachments.getFirst();

        val scope = AttachmentKeyUtils.scope(attachment.context(), attachment.contextId());
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
    }
}
