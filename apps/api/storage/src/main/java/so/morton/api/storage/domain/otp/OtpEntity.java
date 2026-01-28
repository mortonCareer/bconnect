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

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private int dailyCount;

    @Column(nullable = false)
    private int attemptCount;

    @Column(nullable = false)
    private LocalDateTime expiredAt;

    // TODO: 생성자, 업데이트 메서드
}
