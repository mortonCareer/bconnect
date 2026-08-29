package to.bconnect.api.storage.board;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "boards")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "dtype")
    private BoardType type;

    private Long projectId;

    private Long driveId;

    public void detachProject() {
        this.projectId = null;
    }
}
