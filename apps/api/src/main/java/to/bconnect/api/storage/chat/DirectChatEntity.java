package to.bconnect.api.storage.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(
        name = "direct_chats",
        uniqueConstraints = @UniqueConstraint(columnNames = {"minId", "maxId"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DirectChatEntity extends BaseEntity {

    @Column(nullable = false)
    private Long minId;

    @Column(nullable = false)
    private Long maxId;

    @Column(nullable = false)
    private Long minLastIdx;

    @Column(nullable = false)
    private Long maxLastIdx;

    private DirectChatEntity(Long minId, Long maxId) {
        this.minId = minId;
        this.maxId = maxId;
        this.minLastIdx = 0L;
        this.maxLastIdx = 0L;
    }

    public static DirectChatEntity of(Long memberId, Long otherId) {
        return new DirectChatEntity(Math.min(memberId, otherId), Math.max(memberId, otherId));
    }

    public Long counterpartIdOf(Long memberId) {
        return minId.equals(memberId) ? maxId : minId;
    }

    public void markRead(Long memberId, Long messageId) {
        if (minId.equals(memberId)) this.minLastIdx = messageId;
        else if (maxId.equals(memberId)) this.maxLastIdx = messageId;
    }
}
