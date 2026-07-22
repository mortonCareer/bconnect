package to.bconnect.api.storage.recommendation;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "recommendations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RecommendationEntity extends BaseEntity {

    private Long fromId;

    private Long toId;

    private String content;

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
