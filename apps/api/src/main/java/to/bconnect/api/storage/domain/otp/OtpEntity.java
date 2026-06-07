package to.bconnect.api.storage.domain.otp;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.AttributeOverrides;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "otps")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OtpEntity extends BaseEntity {

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String code;

    @Column(name = "code_expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "code_revoked", nullable = false)
    private boolean revoked = true;

    @AttributeOverrides({
            @AttributeOverride(name = "expiredAt", column = @Column(name = "token_expired_at")),
            @AttributeOverride(name = "revoked", column = @Column(name = "token_revoked"))
    })
    @Embedded
    private SignupToken token;

    @Column(nullable = false)
    private int dailyCount;

    @Column(nullable = false)
    private LocalDateTime lastSentAt;

    public OtpEntity(String phone, String code, LocalDateTime expiredAt) {
        this.phone = phone;
        this.code = code;
        this.expiredAt = expiredAt;
        this.revoked = false;
        this.dailyCount = 0;
        this.lastSentAt = LocalDateTime.now();
    }

    public void generateCode(String code, LocalDateTime expiredAt) {
        this.code = code;
        this.expiredAt = expiredAt;
        this.revoked = false;
        this.dailyCount++;
        this.lastSentAt = LocalDateTime.now();
    }

    public void attempt() {
        this.attempts++;
    }

    public void invalidateCode() {
        this.revoked = true;
    }

    public void generateToken(String token, LocalDateTime expiredAt) {
        this.token = new SignupToken(token, expiredAt);
    }

    public void invalidateToken() {
        this.token.invalidate();
    }

    public void dailyReset() {
        this.dailyCount = 0;
    }
}
