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
    private int dailyCount;

    @Column(nullable = false)
    private int attemptCount;

    @Column(nullable = false)
    private LocalDateTime expiredAt;

    public OtpEntity(String phone, String code, LocalDateTime expiredAt) {
        this.phone = phone;
        this.code = code;
        this.dailyCount = 1;
        this.attemptCount = 0;
        this.expiredAt = expiredAt;
    }

    public void update(String code, int dailyCount, LocalDateTime expiredAt) {
        this.code = code;
        this.dailyCount = dailyCount;
        this.attemptCount = 0;
        this.expiredAt = expiredAt;
    }

    public void incrementAttemptCount() {
        this.attemptCount++;
    }
}
