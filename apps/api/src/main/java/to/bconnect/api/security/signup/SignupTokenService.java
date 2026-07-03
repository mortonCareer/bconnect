package to.bconnect.api.security.signup;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.AuthExceptionCode;
import to.bconnect.api.security.AuthUtils;
import to.bconnect.api.storage.signup.SignupTokenEntity;
import to.bconnect.api.storage.signup.SignupTokenRepository;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SignupTokenService {

    private static final int EXPIRY_MINUTES = 10;

    private final SignupTokenRepository signupTokenRepository;

    @Transactional
    public String generate(String phone) {
        val token = UUID.randomUUID().toString();
        val encrypted = AuthUtils.sha256(token);
        val expiredAt = LocalDateTime.now().plusMinutes(EXPIRY_MINUTES);
        val optional = signupTokenRepository.findByPhone(phone);

        if (optional.isPresent()) {
            optional.get().update(encrypted, expiredAt);
        } else {
            signupTokenRepository.save(new SignupTokenEntity(phone, encrypted, expiredAt));
        }

        return token;
    }

    @Transactional
    public String verify(String token) {
        val found = signupTokenRepository.findByToken(AuthUtils.sha256(token))
                .orElseThrow(() -> new CodeException(AuthExceptionCode.INVALID_SIGNUP_TOKEN));

        if (found.isRevoked())
            throw new CodeException(AuthExceptionCode.INVALID_SIGNUP_TOKEN);
        if (found.getExpiredAt().isBefore(LocalDateTime.now()))
            throw new CodeException(AuthExceptionCode.SIGNUP_TOKEN_EXPIRED);

        found.revoke();
        return found.getPhone();
    }
}
