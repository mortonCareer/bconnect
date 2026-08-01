package to.bconnect.api.notification.domain;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.notification.NotificationType;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.CursorFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.NotificationFactory;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class NotificationQueryServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private NotificationQueryService notificationQueryService;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("list - 알림이 있을 때 커서 페이지네이션 조회하면 최신순 페이지를 반환한다")
    void list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val sender = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        notificationRepository.save(NotificationFactory.entity(member.getId(), sender.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 100L));
        val second = notificationRepository.save(NotificationFactory.entity(member.getId(), sender.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 101L));
        val third = notificationRepository.save(NotificationFactory.entity(member.getId(), sender.getId(),
                NotificationType.COWORKER_REQUESTED, NotificationReferenceType.COWORKER_REQUEST, 102L));
        notificationRepository.save(NotificationFactory.entity(sender.getId(), member.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 103L));
        val cursor = CursorFactory.request(null, 2);

        // when
        val firstPage = notificationQueryService.list(UserFactory.domain(member.getId(), Role.CAREER), cursor);

        // then
        assertThat(firstPage.content()).hasSize(2);
        assertThat(firstPage.content().getFirst().id()).isEqualTo(third.getId());
        assertThat(firstPage.content().get(1).id()).isEqualTo(second.getId());
        assertThat(firstPage.hasNext()).isTrue();
        assertThat(firstPage.nextCursor()).isEqualTo(second.getId());
    }

    @Test
    @DisplayName("unreadCount - 읽음·미읽음 알림이 있을 때 개수를 조회하면 미읽음 개수를 반환한다")
    void unreadCount_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val sender = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        notificationRepository.save(NotificationFactory.entity(member.getId(), sender.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 100L));
        val read = notificationRepository.save(NotificationFactory.entity(member.getId(), sender.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 102L));
        read.markRead();
        notificationRepository.save(NotificationFactory.entity(sender.getId(), member.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 103L));

        // when
        val count = notificationQueryService.unreadCount(UserFactory.domain(member.getId(), Role.CAREER));

        // then
        assertThat(count).isEqualTo(1L);
    }

    @Test
    @DisplayName("markRead - 본인 알림일 때 읽음 처리하면 알림이 읽음으로 변경된다")
    void markRead_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val sender = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val notification = notificationRepository.save(NotificationFactory.entity(member.getId(), sender.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 100L));

        // when
        notificationQueryService.markRead(UserFactory.domain(member.getId(), Role.CAREER), notification.getId());

        // then
        val found = notificationRepository.findById(notification.getId()).orElseThrow();
        assertThat(found.isRead()).isTrue();
    }

    @Test
    @DisplayName("markRead - 알림이 존재하지 않을 때 읽음 처리하면 NOT_FOUND로 실패한다")
    void markRead_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> notificationQueryService.markRead(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("markRead - 타인의 알림일 때 읽음 처리하면 FORBIDDEN으로 실패한다")
    void markRead_fail_C004() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val notification = notificationRepository.save(NotificationFactory.entity(other.getId(), member.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 100L));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> notificationQueryService.markRead(user, notification.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("markAllRead - 미읽음 알림이 있을 때 전체 읽음 처리하면 미읽음 알림이 남지 않는다")
    void markAllRead_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val sender = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        notificationRepository.save(NotificationFactory.entity(member.getId(), sender.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 100L));
        notificationRepository.save(NotificationFactory.entity(member.getId(), sender.getId(),
                NotificationType.CHAT_MESSAGE, NotificationReferenceType.CHAT_ROOM, 101L));

        // when
        notificationQueryService.markAllRead(UserFactory.domain(member.getId(), Role.CAREER));

        // then
        val memberCount = notificationRepository.countByMemberIdAndReadIsFalse(member.getId());
        assertThat(memberCount).isZero();
    }
}
