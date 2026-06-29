package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.notification.Notification;
import to.bconnect.api.core.domain.notification.NotificationExceptionCode;
import to.bconnect.api.core.domain.notification.NotificationQueryService;
import to.bconnect.api.core.presentation.v1.response.NotificationResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.notification.NotificationTypeEntity;
import to.bconnect.api.storage.notification.NotificationTypeRepository;

import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationQueryService notificationQueryService;
    private final MemberResolver memberResolver;
    private final NotificationTypeRepository notificationTypeRepository;

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

        val typeCodes = page.content().stream().map(Notification::typeCode).distinct().toList();
        val typeMap = notificationTypeRepository.findByCodeIn(typeCodes).stream()
                .collect(Collectors.toMap(NotificationTypeEntity::getCode, Function.identity()));

        val content = page.content().stream()
                .map(it -> {
                    val type = typeMap.get(it.typeCode());
                    if (type == null) throw new CodeException(NotificationExceptionCode.UNKNOWN_TYPE);
                    val sender = it.senderId() == null ? null : memberMap.get(it.senderId());
                    return NotificationResponse.of(it, type.getMessage(), type.getReferenceType(), sender);
                })
                .toList();

        return ApiResponse.success(new CursorPage<>(content, page.hasNext(), page.nextCursor()));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Long> unreadCount(@AuthenticationPrincipal AuthUser user) {
        return ApiResponse.success(notificationQueryService.unreadCount(user));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markRead(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        notificationQueryService.markRead(user, id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllRead(@AuthenticationPrincipal AuthUser user) {
        notificationQueryService.markAllRead(user);
        return ApiResponse.success(null);
    }
}
