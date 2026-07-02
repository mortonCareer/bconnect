package to.bconnect.api.storage.board;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "notes")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NoteEntity extends BaseEntity {

    @Column(nullable = false)
    private Long boardId;

    @Column(nullable = false)
    private Long memberId;

    @Column(columnDefinition = "TEXT")
    private String content;

    public NoteEntity(Long boardId, Long memberId, String content) {
        this.boardId = boardId;
        this.memberId = memberId;
        this.content = content;
    }

    public void update(String content) {
        this.content = content;
    }
}
