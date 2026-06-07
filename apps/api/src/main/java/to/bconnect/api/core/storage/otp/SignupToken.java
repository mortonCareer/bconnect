package to.bconnect.api.core.storage.otp;

import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SignupToken {

    private String token;

    private LocalDateTime expiredAt;

    private boolean revoked = true;

    public SignupToken(String token, LocalDateTime expiredAt) {
        this.token = token;
        this.expiredAt = expiredAt;
        this.revoked = false;
    }

    public void invalidate() {
        this.revoked = true;
    }
}
