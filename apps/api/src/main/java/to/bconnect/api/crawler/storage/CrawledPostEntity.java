package to.bconnect.api.crawler.storage;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "crawled_posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CrawledPostEntity extends BaseEntity {

    private Long profileId;

    private Long taskId;

    private String title;

    private String content;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "crawled_post_images", joinColumns = @JoinColumn(name = "post_id"))
    @OrderColumn(name = "seq")
    @Column(name = "url")
    private List<String> images = new ArrayList<>();

    public CrawledPostEntity(Long profileId, Long taskId, String title, String content, List<String> images) {
        this.profileId = profileId;
        this.taskId = taskId;
        this.title = title;
        this.content = content;
        this.images = images != null ? images : new ArrayList<>();
    }
}
