package to.bconnect.api.storage.device;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "device_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DeviceTokenEntity extends BaseEntity {

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DevicePlatform platform;

    @Column(nullable = false)
    private String endpoint;

    @Column(nullable = false)
    private boolean enabled = true;

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
