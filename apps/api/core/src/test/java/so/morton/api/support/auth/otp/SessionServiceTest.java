package so.morton.api.support.auth.otp;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import so.morton.api.storage.domain.session.SessionEntity;
import so.morton.api.storage.domain.session.SessionRepository;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SessionService 테스트")
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @InjectMocks
    private SessionService sessionService;

    @Test
    @DisplayName("기존 세션이 없으면 새로운 세션을 생성한다")
    void saveSession_whenNoExisting_createsNew() {
        // given
        String username = "testuser";
        String agent = "Mozilla/5.0";
        String ip = "127.0.0.1";
        String refreshToken = "refresh-token-123";

        when(sessionRepository.findByUsername(username)).thenReturn(Optional.empty());

        // when
        sessionService.upsert(username, agent, ip, refreshToken);

        // then
        verify(sessionRepository).findByUsername(username);
        verify(sessionRepository).save(any(SessionEntity.class));
    }

    @Test
    @DisplayName("기존 세션이 있으면 업데이트한다")
    void saveSession_whenExisting_updatesExisting() {
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
        sessionService.upsert(username, agent, ip, refreshToken);

        // then
        verify(sessionRepository).findByUsername(username);
        verify(sessionRepository, never()).save(any(SessionEntity.class));
        // update() method will be called on the existing entity
    }
}
