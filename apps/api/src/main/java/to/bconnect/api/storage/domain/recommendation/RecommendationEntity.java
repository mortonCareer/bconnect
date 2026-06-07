package to.bconnect.api.storage.domain.recommendation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(
        name = "recommendations",
        indexes = @Index(
                name = "udx_recommendation_from_to",
                columnList = "fromId, toId",
                unique = true
        )
)
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
    private boolean visible = false;

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
