package to.bconnect.api.storage.drive;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "drives")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DriveEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "dtype")
    private DriveType type;

    private Long projectId;

    private Long memberId;

    private String title;

    public void update(String title) {
        this.title = title;
    }
}
