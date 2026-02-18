package so.morton.api.storage.domain.otp;

import jakarta.persistence.Column;
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
    private LocalDateTime codeExpiredAt;

    @Column(nullable = false)
    private int dailyCount;

    @Column(nullable = false)
    private int attemptCount;

    private String signupToken;

    private LocalDateTime signupTokenExpiredAt;

    public OtpEntity(String phone, String code, LocalDateTime codeExpiredAt) {
        this.phone = phone;
        this.code = code;
        this.codeExpiredAt = codeExpiredAt;
        this.dailyCount = 1;
        this.attemptCount = 0;
    }

    public void generateCode(String code, LocalDateTime codeExpiredAt) {
        this.code = code;
        this.codeExpiredAt = codeExpiredAt;
        this.dailyCount++;
        this.attemptCount = 0;
    }

    public void generateToken(String signupToken, LocalDateTime signupTokenExpiredAt) {
        this.signupToken = signupToken;
        this.signupTokenExpiredAt = signupTokenExpiredAt;
    }

    public void incrementAttemptCount() {
        this.attemptCount++;
    }

    public void resetDailyCount() {
        this.dailyCount = 0;
    }

    public void invalidateCode() {
        this.codeExpiredAt = LocalDateTime.MIN;
    }

    public void invalidateToken() {
        this.signupTokenExpiredAt =  LocalDateTime.MIN;
    }
}
