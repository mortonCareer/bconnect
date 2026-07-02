package to.bconnect.api.storage.board;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "notes")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NoteEntity extends BaseEntity {

    private Long boardId;

    private Long memberId;

    private String content;

    public void update(String content) {
        this.content = content;
    }
}
