package so.morton.api.support.auth.otp;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.storage.domain.session.SessionEntity;
import so.morton.api.storage.domain.session.SessionRepository;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;

    public boolean existByRefreshToken(String refreshToken) {
        return sessionRepository.existsByRefreshToken(refreshToken);
    }

    public void upsert(String username, String agent, String ip, String refreshToken) {
        sessionRepository.findByUsername(username)
            .ifPresentOrElse(
                saved -> saved.update(agent, ip, refreshToken),
                () -> sessionRepository.save(
                    SessionEntity.builder()
                        .username(username)
                        .agent(agent)
                        .ip(ip)
                        .refreshToken(refreshToken)
                        .build()
                )
            );
    }
}
