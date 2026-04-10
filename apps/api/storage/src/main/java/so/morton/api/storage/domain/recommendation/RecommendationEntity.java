package so.morton.api.storage.domain.recommendation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.support.BaseEntity;

@Entity
@Table(name = "recommendations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendationEntity extends BaseEntity {

    @Column(nullable = false)
    private Long fromId;

    @Column(nullable = false)
    private Long toId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private boolean visible = true;

    public RecommendationEntity(Long fromId, Long toId, String content) {
        this.fromId = fromId;
        this.toId = toId;
        this.content = content;
    }

    public void update(String content) {
        this.content = content;
    }

    public void hide() {
        this.visible = false;
    }

    public void show() {
        this.visible = true;
    }
}
