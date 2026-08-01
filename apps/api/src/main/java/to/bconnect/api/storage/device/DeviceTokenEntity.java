package to.bconnect.api.storage.device;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

// BaseEntity 미상속 의도: @SoftDelete 가 물리삭제를 막아 token unique 재등록 충돌 → 물리삭제 위해 감사필드 직접 부착.
@Entity
@Table(name = "device_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class DeviceTokenEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false, unique = true)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DevicePlatform platform;

    @Column(nullable = false)
    private String endpoint;

    @Column(nullable = false)
    private boolean enabled = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @LastModifiedDate
    @Column(nullable = false)
    private Instant modifiedAt = Instant.now();

    public DeviceTokenEntity(Long memberId, String token, DevicePlatform platform, String endpoint) {
        this.memberId = memberId;
        this.token = token;
        this.platform = platform;
        this.endpoint = endpoint;
        this.enabled = true;
    }

    public void refresh(Long memberId, String endpoint) {
        this.memberId = memberId;
        this.endpoint = endpoint;
        this.enabled = true;
    }

    public void disable() {
        this.enabled = false;
    }
}
