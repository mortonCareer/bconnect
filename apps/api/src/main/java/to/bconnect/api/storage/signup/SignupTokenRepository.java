package to.bconnect.api.storage.signup;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SignupTokenRepository extends JpaRepository<SignupTokenEntity, Long> {

    Optional<SignupTokenEntity> findByPhone(String phone);

    void deleteByPhone(String phone);

    Optional<SignupTokenEntity> findByToken(String token);

}
