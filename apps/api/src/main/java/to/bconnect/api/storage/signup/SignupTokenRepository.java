package to.bconnect.api.storage.signup;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface SignupTokenRepository extends JpaRepository<SignupTokenEntity, Long> {

    Optional<SignupTokenEntity> findByPhone(String phone);

    void deleteByPhone(String phone);

    Optional<SignupTokenEntity> findByToken(String token);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM SignupTokenEntity s WHERE s.expiredAt <= :threshold")
    int deleteExpired(@Param("threshold") Instant threshold);

}
