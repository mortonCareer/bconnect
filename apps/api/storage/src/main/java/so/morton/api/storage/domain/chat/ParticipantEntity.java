package so.morton.api.storage.domain.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.support.BaseEntity;

@Entity
@Table(name = "participants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ParticipantEntity extends BaseEntity {

    @Column(nullable = false)
    private Long chatId;

    @Column(nullable = false)
    private Long memberId;

    @Column(nullable = false)
    private Long lastIdx;

    @Builder
    public ParticipantEntity(Long chatId, Long memberId, Long lastIdx) {
        this.chatId = chatId;
        this.memberId = memberId;
        this.lastIdx = lastIdx != null ? lastIdx : 0L;
    }
}
