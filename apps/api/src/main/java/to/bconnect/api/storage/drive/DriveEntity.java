package to.bconnect.api.storage.drive;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "drives")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DriveEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "dtype", nullable = false)
    private DriveType type;

    @Column
    private Long projectId;

    @Column
    private Long ownerId;

    @Column(nullable = false)
    private String title;

    public DriveEntity(DriveType type, Long projectId, Long ownerId, String title) {
        this.type = type;
        this.projectId = projectId;
        this.ownerId = ownerId;
        this.title = title;
    }

    public void update(String title) {
        this.title = title;
    }
}
