package to.bconnect.api.storage.otp;

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

    private String phone;

    private String code;

    private LocalDateTime expiredAt;

    private int attempts = 0;

    private boolean revoked = true;

    private int dailyCount;

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
        this.attempts = 0;
        this.dailyCount++;
        this.lastSentAt = LocalDateTime.now();
    }

    public void attempt() {
        this.attempts++;
    }

    public void invalidateCode() {
        this.revoked = true;
    }

    public void dailyReset() {
        this.dailyCount = 0;
    }
}
