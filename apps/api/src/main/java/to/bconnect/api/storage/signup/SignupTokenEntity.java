package to.bconnect.api.storage.signup;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.time.OffsetDateTime;

@Entity
@Table(name = "signup_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SignupTokenEntity extends BaseEntity {

    private String phone;

    private String token;

    private OffsetDateTime expiredAt;

    private boolean revoked;

    public SignupTokenEntity(String phone, String token, OffsetDateTime expiredAt) {
        this.phone = phone;
        this.token = token;
        this.expiredAt = expiredAt;
        this.revoked = false;
    }

    public void update(String token, OffsetDateTime expiredAt) {
        this.token = token;
        this.expiredAt = expiredAt;
        this.revoked = false;
    }

    public void revoke() {
        this.revoked = true;
    }
}
