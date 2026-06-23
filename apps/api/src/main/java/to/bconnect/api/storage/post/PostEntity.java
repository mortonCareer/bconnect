package to.bconnect.api.storage.post;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostEntity extends BaseEntity {

    @Column
    private Long memberId;

    @Column
    private Long taskId;

    @Column(columnDefinition = "TEXT")
    private String content;

    public PostEntity(Long memberId, Long taskId, String content) {
        this.memberId = memberId;
        this.taskId = taskId;
        this.content = content;
    }

    public void update(String content) {
        this.content = content;
    }
}
