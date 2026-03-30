package so.morton.api.storage.domain.otp;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.support.BaseEntity;

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

    @Column(nullable = false)
    private LocalDateTime expiredAt;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(nullable = false)
    private boolean revoked = true;

    @Embedded
    private SignupToken token;

    @Column(nullable = false)
    private int dailyCount;

    public OtpEntity(String phone, String code, LocalDateTime expiredAt) {
        this.phone = phone;
        this.code = code;
        this.expiredAt = expiredAt;
        this.revoked = false;
        this.dailyCount = 1;
    }

    public void generateCode(String code, LocalDateTime expiredAt) {
        this.code = code;
        this.expiredAt = expiredAt;
        this.revoked = false;
        this.dailyCount++;
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
