package so.morton.api.support.auth.otp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import so.morton.api.support.AuthExceptionCode;
import so.morton.api.support.fixture.MemberFactory;
import so.morton.api.support.fixture.SessionFactory;
import so.morton.api.support.sms.SmsProvider;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static so.morton.api.support.CodeExceptionAssert.assertCodeException;
import static so.morton.api.support.auth.AuthUtils.sha256;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionService 테스트")
class SessionServiceTest {

    @Mock private SessionRepository sessionRepository;
    @Mock private MemberRepository memberRepository;
    @Mock private SmsProvider smsProvider;
    @InjectMocks private SessionService sessionService;

    private static final String PHONE = "01000000000";
    private static final String USERNAME = "testuser";

    @Nested
    @DisplayName("SessionService.verify")
    class VerifyTests {

        @Test
        @DisplayName("세션 검증 성공")
        void verify_success() {
            // given
            String rawToken = "refresh-token-123";
            SessionEntity session = SessionFactory.createEntity(USERNAME, "agent", "ip", sha256(rawToken));
            when(sessionRepository.findByUsername(USERNAME)).thenReturn(Optional.of(session));

            // when & then
            sessionService.verify(USERNAME, rawToken);
            verify(sessionRepository).findByUsername(USERNAME);
        }

        @Test
        @DisplayName("세션 미존재 시 SESSION_EXPIRED")
        void verify_sessionNotFound() {
            // given
            when(sessionRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> sessionService.verify(USERNAME, "any-token"))
                    .hasExceptionCode(AuthExceptionCode.SESSION_EXPIRED);
        }

        @Test
        @DisplayName("토큰 불일치 시 INVALID_REFRESH_TOKEN")
        void verify_tokenMismatch() {
            // given
            SessionEntity session = SessionFactory.createEntity(USERNAME, "agent", "ip", sha256("correct-token"));
            when(sessionRepository.findByUsername(USERNAME)).thenReturn(Optional.of(session));

            // when & then
            assertCodeException(() -> sessionService.verify(USERNAME, "wrong-token"))
                    .hasExceptionCode(AuthExceptionCode.INVALID_REFRESH_TOKEN);
        }

        @Test
        @DisplayName("폐기된 세션 시 SESSION_EXPIRED")
        void verify_revokedSession() {
            // given
            String rawToken = "refresh-token-123";
            SessionEntity session = SessionFactory.createEntity(USERNAME, "agent", "ip", sha256(rawToken));
            session.revoke();
            when(sessionRepository.findByUsername(USERNAME)).thenReturn(Optional.of(session));

            // when & then
            assertCodeException(() -> sessionService.verify(USERNAME, rawToken))
                    .hasExceptionCode(AuthExceptionCode.SESSION_EXPIRED);
        }
    }

    @Nested
    @DisplayName("SessionService.logout")
    class LogoutTests {

        @Test
        @DisplayName("로그아웃 성공")
        void logout_success() {
            // given
            SessionEntity session = SessionFactory.createEntity(USERNAME);
            when(sessionRepository.findByUsername(USERNAME)).thenReturn(Optional.of(session));

            // when
            sessionService.logout(USERNAME);

            // then
            verify(sessionRepository).findByUsername(USERNAME);
            assertThat(session.isRevoked()).isTrue();
        }

        @Test
        @DisplayName("미존재 세션 로그아웃 시 SESSION_EXPIRED")
        void logout_sessionNotFound() {
            // given
            when(sessionRepository.findByUsername(USERNAME)).thenReturn(Optional.empty());

            // when & then
            assertCodeException(() -> sessionService.logout(USERNAME))
                    .hasExceptionCode(AuthExceptionCode.SESSION_EXPIRED);
        }
    }

    @Nested
    @DisplayName("SessionService.login")
    class LoginTests {

        @Test
        @DisplayName("신규 세션 생성 및 SMS 발송")
        void login_newSession() {
            // given
            String username = "testuser";
            String agent = "Mozilla/5.0";
            String ip = "127.0.0.1";
            String refreshToken = "refresh-token-123";

            MemberEntity member = MemberFactory.createEntity(username, PHONE, Role.FOREMAN);

            when(sessionRepository.findByUsername(username)).thenReturn(Optional.empty());
            when(memberRepository.findByUsername(username)).thenReturn(Optional.of(member));

            // when
            sessionService.login(username, agent, ip, refreshToken);

            // then
            verify(sessionRepository).save(any(SessionEntity.class));
            verify(smsProvider).send(eq(PHONE), anyString());
        }

        @Test
        @DisplayName("기존 세션 갱신")
        void login_existingSession() {
            // given
            String username = "testuser";
            String agent = "Mozilla/5.0";
            String ip = "127.0.0.1";
            String refreshToken = "refresh-token-123";

            SessionEntity existingSession = SessionFactory.createEntity(username, "old-agent", "old-ip", "old-token");

            when(sessionRepository.findByUsername(username)).thenReturn(Optional.of(existingSession));

            // when
            sessionService.login(username, agent, ip, refreshToken);

            // then
            verify(sessionRepository, never()).save(any(SessionEntity.class));
            verify(smsProvider, never()).send(anyString(), anyString());
            assertThat(existingSession.getAgent()).isEqualTo(agent);
            assertThat(existingSession.getIp()).isEqualTo(ip);
        }
    }
}
