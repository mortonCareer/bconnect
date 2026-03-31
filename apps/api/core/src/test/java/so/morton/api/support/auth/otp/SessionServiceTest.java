package so.morton.api.support.auth.otp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.domain.member.MemberRepository;
import so.morton.api.storage.domain.session.SessionEntity;
import so.morton.api.storage.domain.session.SessionRepository;
import so.morton.api.storage.value.Role;
import so.morton.api.support.auth.AuthUtils;
import so.morton.api.support.sms.SmsProvider;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionService 테스트")
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private SmsProvider smsProvider;

    @InjectMocks
    private SessionService sessionService;

    private static final String PHONE = "01012345678";

    @Test
    @DisplayName("기존 세션이 없으면 새로 생성하고 SMS를 발송한다")
    void login_newSession() {
        // given
        String username = "testuser";
        String agent = "Mozilla/5.0";
        String ip = "127.0.0.1";
        String refreshToken = "refresh-token-123";

        MemberEntity member = MemberEntity.builder()
                .username(username)
                .name("test")
                .phone(PHONE)
                .picture("")
                .role(Role.FOREMAN)
                .build();

        when(sessionRepository.findByUsername(username)).thenReturn(Optional.empty());
        when(memberRepository.findByUsername(username)).thenReturn(Optional.of(member));

        // when
        sessionService.login(username, agent, ip, refreshToken);

        // then
        verify(sessionRepository).save(any(SessionEntity.class));
        verify(smsProvider).send(eq(PHONE), anyString());
    }

    @Test
    @DisplayName("기존 세션이 있으면 정보를 갱신한다")
    void login_existingSession() {
        // given
        String username = "testuser";
        String agent = "Mozilla/5.0";
        String ip = "127.0.0.1";
        String refreshToken = "refresh-token-123";

        SessionEntity existingSession = SessionEntity.builder()
                .username(username)
                .agent("old-agent")
                .ip("old-ip")
                .refreshToken("old-token")
                .build();

        when(sessionRepository.findByUsername(username)).thenReturn(Optional.of(existingSession));

        // when
        sessionService.login(username, agent, ip, refreshToken);

        // then
        verify(sessionRepository, never()).save(any(SessionEntity.class));
    }
}
