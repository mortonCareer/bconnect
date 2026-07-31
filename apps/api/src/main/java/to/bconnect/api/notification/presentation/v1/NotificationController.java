package to.bconnect.api.notification.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.AttachmentUrlService;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.core.domain.company.CompanyService;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.notification.domain.Notification;
import to.bconnect.api.notification.domain.NotificationQueryService;
import to.bconnect.api.notification.presentation.v1.response.NotificationResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.notification.NotificationSenderType;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationQueryService notificationQueryService;
    private final MemberResolver memberResolver;
    private final CompanyService companyService;
    private final AttachmentUrlService attachmentUrlService;

    @GetMapping
    public ApiResponse<CursorPage<NotificationResponse>> list(
            @AuthenticationPrincipal AuthUser user,
            CursorLimit cursorLimit) {
        val page = notificationQueryService.list(user, cursorLimit);

        val memberIds = Notification.senderIds(page.content(), NotificationSenderType.MEMBER);
        val companyIds = Notification.senderIds(page.content(), NotificationSenderType.COMPANY);
        val memberMap = memberResolver.resolveMapOrWithdrawn(memberIds);
        val companyMap = companyService.resolveMapOrWithdrawn(companyIds);
        val pictureMap = attachmentUrlService.map(AttachmentReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val content = page.content().stream()
                .map(it -> {
                    val member = it.senderType() == NotificationSenderType.MEMBER
                            ? memberMap.get(it.senderId()) : null;
                    val company = it.senderType() == NotificationSenderType.COMPANY
                            ? companyMap.get(it.senderId()) : null;
                    val picture = member == null ? null : pictureMap.get(member.id());
                    return NotificationResponse.of(it, member, company, picture);
                })
                .toList();

        return ApiResponse.success(new CursorPage<>(content, page.hasNext(), page.nextCursor()));
    }

    @GetMapping("/unread/count")
    public ApiResponse<Long> unreadCount(@AuthenticationPrincipal AuthUser user) {
        return ApiResponse.success(notificationQueryService.unreadCount(user));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<Void> markRead(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        notificationQueryService.markRead(user, id);
        return ApiResponse.success(null);
    }

    @PostMapping("/read")
    public ApiResponse<Void> markAllRead(@AuthenticationPrincipal AuthUser user) {
        notificationQueryService.markAllRead(user);
        return ApiResponse.success(null);
    }
}
