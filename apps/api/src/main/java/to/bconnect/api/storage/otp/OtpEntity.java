package to.bconnect.api.storage.otp;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.time.Instant;

@Entity
@Table(name = "otps")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OtpEntity extends BaseEntity {

    private String phone;

    private String code;

    private Instant expiredAt;

    private int attempts = 0;

    private boolean revoked = true;

    private int dailyCount;

    private Instant lastSentAt;

    public OtpEntity(String phone, String code, Instant expiredAt) {
        this.phone = phone;
        this.code = code;
        this.expiredAt = expiredAt;
        this.revoked = false;
        this.dailyCount = 0;
        this.lastSentAt = Instant.now();
    }

    public void generateCode(String code, Instant expiredAt) {
        this.code = code;
        this.expiredAt = expiredAt;
        this.revoked = false;
        this.attempts = 0;
        this.dailyCount++;
        this.lastSentAt = Instant.now();
    }

    public void attempt() {
        this.attempts++;
    }

    public void invalidateCode() {
        this.code = null;
        this.revoked = true;
    }

    public void dailyReset() {
        this.dailyCount = 0;
    }
}
