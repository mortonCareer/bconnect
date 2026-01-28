package so.morton.api.storage.domain.session;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SessionRepository extends JpaRepository<SessionEntity, Long> {

    Optional<SessionEntity> findByRefreshToken(String refreshToken);

    Optional<SessionEntity> findByUsername(String username);

}
