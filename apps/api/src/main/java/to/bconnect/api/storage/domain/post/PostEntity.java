package to.bconnect.api.storage.domain.post;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostEntity extends BaseEntity {

    @Column(name = "profile_id")
    private Long profileId;

    @Column(name = "task_id")
    private Long taskId;

    // TODO: MappingTableEntity 분리
    @ElementCollection
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    private List<String> images = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String content;

    @Builder
    public PostEntity(Long profileId, Long taskId, List<String> images, String content) {
        this.profileId = profileId;
        this.taskId = taskId;
        this.images = images != null ? images : new ArrayList<>();
        this.content = content;
    }

    public void update(String content) {
        this.content = content;
    }
}
