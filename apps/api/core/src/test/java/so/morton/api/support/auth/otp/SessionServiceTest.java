package so.morton.api.support.auth.otp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import so.morton.api.storage.domain.session.SessionEntity;
import so.morton.api.storage.domain.session.SessionRepository;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionService 테스트")
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private SessionService sessionService;

    @Test
    @DisplayName("기존 세션이 없으면 새로 생성한다")
    void upsert_newSession() {
        // given
        String username = "testuser";
        String agent = "Mozilla/5.0";
        String ip = "127.0.0.1";
        String refreshToken = "refresh-token-123";

        when(passwordEncoder.encode(refreshToken)).thenReturn("encoded-token");
        when(sessionRepository.findByUsername(username)).thenReturn(Optional.empty());

        // when
        sessionService.upsert(username, agent, ip, refreshToken);

        // then
        verify(passwordEncoder).encode(refreshToken);
        verify(sessionRepository).save(any(SessionEntity.class));
    }

     @Test
     @DisplayName("기존 세션이 있으면 정보를 갱신한다")
     void upsert_existingSession() {
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

         when(passwordEncoder.encode(refreshToken)).thenReturn("encoded-token");
         when(sessionRepository.findByUsername(username)).thenReturn(Optional.of(existingSession));

         // when
         sessionService.upsert(username, agent, ip, refreshToken);

         // then
         verify(passwordEncoder).encode(refreshToken);
         verify(sessionRepository, never()).save(any(SessionEntity.class));
     }
}
