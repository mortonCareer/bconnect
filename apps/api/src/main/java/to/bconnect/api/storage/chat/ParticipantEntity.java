package to.bconnect.api.storage.chat;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "participants")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ParticipantEntity extends BaseEntity {

    private Long chatId;

    private Long memberId;

    private Long lastIdx;

    public ParticipantEntity(Long chatId, Long memberId) {
        this.chatId = chatId;
        this.memberId = memberId;
        this.lastIdx = 0L;
    }

    public void read(Long messageId) {
        this.lastIdx = messageId;
    }
}
