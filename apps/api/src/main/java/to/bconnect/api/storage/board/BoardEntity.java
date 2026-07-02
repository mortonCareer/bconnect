package to.bconnect.api.storage.board;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "boards")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardEntity extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "dtype", nullable = false)
    private BoardType type;

    @Column
    private Long projectId;

    @Column
    private Long driveId;

    public BoardEntity(BoardType type, Long projectId, Long driveId) {
        this.type = type;
        this.projectId = projectId;
        this.driveId = driveId;
    }
}
