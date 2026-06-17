package to.bconnect.api.storage.post;

import jakarta.persistence.*;
import lombok.AccessLevel;
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

    @Column
    private Long memberId;

    @Column
    private Long taskId;

    // TODO: MappingTableEntity 분리
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    private List<String> images = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String content;

    public PostEntity(Long memberId, Long taskId, List<String> images, String content) {
        this.memberId = memberId;
        this.taskId = taskId;
        this.images = images != null ? images : new ArrayList<>();
        this.content = content;
    }

    public void update(String content) {
        this.content = content;
    }
}
