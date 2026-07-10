package to.bconnect.api.notification.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.attachment.domain.AttachmentResolver;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.notification.Notification;
import to.bconnect.api.core.domain.notification.NotificationQueryService;
import to.bconnect.api.notification.domain.NotificationType;
import to.bconnect.api.notification.presentation.v1.response.NotificationResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.Objects;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationQueryService notificationQueryService;
    private final MemberResolver memberResolver;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<CursorPage<NotificationResponse>> list(
            @AuthenticationPrincipal AuthUser user,
            CursorLimit cursorLimit) {
        val page = notificationQueryService.list(user, cursorLimit);

        val senderIds = page.content().stream()
                .map(Notification::senderId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        val memberMap = memberResolver.resolveMap(senderIds);
        val pictureMap = attachmentResolver.resolveUrlMap(ReferenceType.MEMBER, senderIds, ImageSize.SMALL);

        val content = page.content().stream()
                .map(it -> {
                    val type = NotificationType.from(it.typeCode());
                    val sender = it.senderId() == null ? null : memberMap.get(it.senderId());
                    return NotificationResponse.of(
                            it, type, sender, sender == null ? null : pictureMap.get(sender.id()));
                })
                .toList();

        return ApiResponse.success(new CursorPage<>(content, page.hasNext(), page.nextCursor()));
    }

    @GetMapping("/unread/count")
    public ApiResponse<Long> unreadCount(@AuthenticationPrincipal AuthUser user) {
        return ApiResponse.success(notificationQueryService.unreadCount(user));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markRead(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        notificationQueryService.markRead(user, id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/read")
    public ApiResponse<Void> markAllRead(@AuthenticationPrincipal AuthUser user) {
        notificationQueryService.markAllRead(user);
        return ApiResponse.success(null);
    }
}
