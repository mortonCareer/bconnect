package to.bconnect.api.security.session;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import to.bconnect.api.support.IntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
@RecordApplicationEvents
class SessionServiceTest {

    private static final Long SEED_MEMBER_ID = 101L;

    @Autowired private SessionService sessionService;
    @Autowired private ApplicationEvents applicationEvents;

    @Test
    @DisplayName("login - 세션이 없는 회원이 로그인하면 memberId가 담긴 새 기기 로그인 이벤트가 발행된다")
    void login_newDevice_publishesEvent() {
        // when
        sessionService.login(String.valueOf(SEED_MEMBER_ID), "agent", "127.0.0.1", "refresh-token");

        // then
        val events = applicationEvents.stream(NewDeviceLoginEvent.class).toList();
        assertThat(events).hasSize(1);
        assertThat(events.getFirst().memberId()).isEqualTo(SEED_MEMBER_ID);
        assertThat(events.getFirst().phone()).isEqualTo("01000000003");
    }

    @Test
    @DisplayName("login - 기존 세션이 있는 회원이 로그인하면 새 기기 로그인 이벤트가 발행되지 않는다")
    void login_existingSession_doesNotPublishEvent() {
        // given
        sessionService.login(String.valueOf(SEED_MEMBER_ID), "agent", "127.0.0.1", "refresh-token");

        // when
        sessionService.login(String.valueOf(SEED_MEMBER_ID), "agent2", "127.0.0.2", "refresh-token2");

        // then
        assertThat(applicationEvents.stream(NewDeviceLoginEvent.class)).hasSize(1);
    }
}
