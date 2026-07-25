package to.bconnect.api.storage.company;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "companies")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CompanyEntity extends BaseEntity {

    private static final long DEFAULT_DRIVE_LIMIT_BYTES = 1024L * 1024 * 1024;

    private Long memberId;

    private String name;

    private String brn;

    private Long driveUsedBytes = 0L;

    private Long driveLimitBytes = DEFAULT_DRIVE_LIMIT_BYTES;

    public CompanyEntity(Long memberId, String name, String brn) {
        this.memberId = memberId;
        this.name = name;
        this.brn = brn;
    }

    public void increaseDriveUsed(long delta) {
        this.driveUsedBytes += delta;
    }

    public void decreaseDriveUsed(long delta) {
        this.driveUsedBytes -= delta;
    }
}
