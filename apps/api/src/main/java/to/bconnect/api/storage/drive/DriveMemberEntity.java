package to.bconnect.api.storage.drive;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "drive_members")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DriveMemberEntity extends BaseEntity {

    @Column(nullable = false)
    private Long driveId;

    @Column(nullable = false)
    private Long memberId;

    public DriveMemberEntity(Long driveId, Long memberId) {
        this.driveId = driveId;
        this.memberId = memberId;
    }
}
