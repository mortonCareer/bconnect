package so.morton.api.support.auth.otp;

import lombok.Getter;
import so.morton.api.storage.domain.otp.OtpEntity;

import java.time.LocalDateTime;

@Getter
public class Otp {
    private String phone;
    private String code;
    private int dailyCount;
    private int attemptCount;
    private LocalDateTime expiredAt;

    private Otp(String phone, String code, int dailyCount, int attemptCount, LocalDateTime expiredAt) {
        this.phone = phone;
        this.code = code;
        this.dailyCount = dailyCount;
        this.attemptCount = attemptCount;
        this.expiredAt = expiredAt;
    }

    public static Otp of(OtpEntity entity) {
        return new Otp(
                entity.getPhone(),
                entity.getCode(),
                entity.getDailyCount(),
                entity.getAttemptCount(),
                entity.getExpiredAt()
        );
    }
}
