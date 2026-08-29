package to.bconnect.api.security.session;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.accesslog.LoginAccessLogRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.MemberFactory;

import static org.assertj.core.api.Assertions.assertThat;

@IntegrationTest
@RecordApplicationEvents
class SessionServiceTest {

    @Autowired private SessionService sessionService;
    @Autowired private MemberRepository memberRepository;
    @Autowired private LoginAccessLogRepository loginAccessLogRepository;
    @Autowired private ApplicationEvents applicationEvents;

    @Test
    @DisplayName("login - 세션이 없는 회원이 로그인하면 memberId가 담긴 새 기기 로그인 이벤트가 발행된다")
    void login_newDevice_publishesEvent() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val expected = new NewDeviceLoginEvent(member.getId(), member.getPhone());

        // when
        sessionService.login(String.valueOf(member.getId()), "agent", "127.0.0.1", "refresh-token");

        // then
        assertThat(applicationEvents.stream(NewDeviceLoginEvent.class)).containsExactly(expected);
        assertThat(loginAccessLogRepository.findAll()).singleElement().satisfies(loginAccessLog -> {
            assertThat(loginAccessLog.getMemberId()).isEqualTo(member.getId());
            assertThat(loginAccessLog.getAgent()).isEqualTo("agent");
            assertThat(loginAccessLog.getIp()).isEqualTo("127.0.0.1");
        });
    }
}
