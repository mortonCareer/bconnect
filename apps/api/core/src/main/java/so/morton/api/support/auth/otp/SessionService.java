package so.morton.api.support.auth.otp;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.storage.domain.session.SessionEntity;
import so.morton.api.storage.domain.session.SessionRepository;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;

    public boolean matchesRefreshToken(String username, String rawRefreshToken) {
        return sessionRepository.findByUsername(username)
            .map(session -> passwordEncoder.matches(rawRefreshToken, session.getRefreshToken()))
            .orElse(false);
    }

    public void upsert(String username, String agent, String ip, String refreshToken) {
        String encodedToken = passwordEncoder.encode(refreshToken);
        sessionRepository.findByUsername(username)
            .ifPresentOrElse(
                saved -> saved.update(agent, ip, encodedToken),
                () -> sessionRepository.save(
                    SessionEntity.builder()
                        .username(username)
                        .agent(agent)
                        .ip(ip)
                        .refreshToken(encodedToken)
                        .build()
                )
            );
    }
}
