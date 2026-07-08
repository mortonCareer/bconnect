package to.bconnect.api.notification.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.notification.NotificationArgs;
import to.bconnect.api.core.domain.notification.NotificationQueryService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.support.IntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@IntegrationTest
@DisplayName("알림 조회 통합: NotificationQueryService (unread · 읽음 · 권한)")
class NotificationQueryIntegrationTest {

    @Autowired NotificationRepository notificationRepository;
    @Autowired NotificationQueryService queryService;
    @Autowired MemberRepository memberRepository;

    private Long member(String key) {
        return memberRepository.save(new MemberEntity("q-" + key, "name", "010-q-" + key, Role.USER)).getId();
    }

    private void saveNotification(Long sender, Long receiver, String content) {
        notificationRepository.save(new NotificationEntity(
                sender, receiver, "CHAT_MESSAGE", 1L, content, NotificationArgs.senderName("가현").toJson()));
    }

    private AuthUser authUser(Long id) {
        return new AuthUser(id, String.valueOf(id), "USER");
    }

    private Long firstNotificationId(Long receiver) {
        return notificationRepository.findAll().stream()
                .filter(n -> receiver.equals(n.getReceiverId()))
                .findFirst().orElseThrow().getId();
    }

    @Test
    @DisplayName("unread count → 단건 읽음 → 전체 읽음 순으로 미읽음 수가 줄어든다")
    void unread_markRead_markAllRead() {
        Long sender = member("sender");
        Long reader = member("reader");
        saveNotification(sender, reader, "n1");
        saveNotification(sender, reader, "n2");
        var user = authUser(reader);

        assertThat(queryService.unreadCount(user)).isEqualTo(2);

        queryService.markRead(user, firstNotificationId(reader));
        assertThat(queryService.unreadCount(user)).isEqualTo(1);

        queryService.markAllRead(user);
        assertThat(queryService.unreadCount(user)).isZero();
    }

    @Test
    @DisplayName("다른 회원의 알림을 읽음 처리하면 FORBIDDEN")
    void markRead_otherUser_forbidden() {
        Long sender = member("f-sender");
        Long owner = member("f-owner");
        Long other = member("f-other");
        saveNotification(sender, owner, "x");
        Long id = firstNotificationId(owner);

        assertThatThrownBy(() -> queryService.markRead(authUser(other), id))
                .isInstanceOf(CodeException.class);
    }

    @Test
    @DisplayName("존재하지 않는 알림을 읽음 처리하면 NOT_FOUND")
    void markRead_nonexistent_notFound() {
        Long owner = member("nf-owner");

        assertThatThrownBy(() -> queryService.markRead(authUser(owner), 99_999_999L))
                .isInstanceOf(CodeException.class);
    }
}
