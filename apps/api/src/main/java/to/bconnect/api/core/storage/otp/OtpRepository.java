package to.bconnect.api.core.storage.otp;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpEntity, Long> {

    Optional<OtpEntity> findByPhone(String phone);

    Optional<OtpEntity> findByCode(String code);

    Optional<OtpEntity> findByToken_Token(String token);

}
