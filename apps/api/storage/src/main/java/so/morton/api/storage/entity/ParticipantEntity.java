package so.morton.api.storage.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "participants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ParticipantEntity extends BaseEntity {

    @Column(nullable = false)
    private Long chatId;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Long lastIdx;

    @Builder
    public ParticipantEntity(Long chatId, Long userId, Long lastIdx) {
        this.chatId = chatId;
        this.userId = userId;
        this.lastIdx = lastIdx != null ? lastIdx : 0L;
    }
}
