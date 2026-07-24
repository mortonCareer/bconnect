package to.bconnect.api.storage.member;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberEntity extends BaseEntity {

    public static final Long SYSTEM_ID = 0L;

    private static final long DEFAULT_DRIVE_LIMIT_BYTES = 1024L * 1024 * 1024;

    private String username;

    private String name;

    private String phone;

    @Enumerated(EnumType.STRING)
    private Role role;

    private Long driveUsedBytes = 0L;

    private Long driveLimitBytes = DEFAULT_DRIVE_LIMIT_BYTES;

    public MemberEntity(String username, String name, String phone, Role role) {
        this.username = username;
        this.name = name;
        this.phone = phone;
        this.role = role;
    }

    public void update(String name) {
        this.name = name;
    }

    public void increaseDriveUsed(long delta) {
        this.driveUsedBytes += delta;
    }

    public void decreaseDriveUsed(long delta) {
        this.driveUsedBytes -= delta;
    }
}
