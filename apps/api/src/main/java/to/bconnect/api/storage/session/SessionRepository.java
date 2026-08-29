package to.bconnect.api.storage.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<SessionEntity, Long> {

    Optional<SessionEntity> findByMemberId(Long memberId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM SessionEntity s WHERE s.modifiedAt <= :threshold")
    int deleteExpired(@Param("threshold") Instant threshold);

}
