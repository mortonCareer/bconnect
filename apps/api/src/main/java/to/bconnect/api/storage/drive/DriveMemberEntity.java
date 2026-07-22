package to.bconnect.api.storage.drive;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "drive_members")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DriveMemberEntity extends BaseEntity {

    private Long driveId;

    private Long memberId;

    private String title;

    public void update(String title) {
        this.title = title;
    }
}
