package so.morton.api.storage.domain.post;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.support.BaseEntity;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostEntity extends BaseEntity {

    @Column(name = "author_id")
    private Long authorId;

    @Column(name = "task_id")
    private Long taskId;

    @ElementCollection
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    private List<String> images = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String content;

    @Builder
    public PostEntity(Long authorId, Long taskId, List<String> images, String content) {
        this.authorId = authorId;
        this.taskId = taskId;
        this.images = images != null ? images : new ArrayList<>();
        this.content = content;
    }

    public void update(String content) {
        this.content = content;
    }
}
