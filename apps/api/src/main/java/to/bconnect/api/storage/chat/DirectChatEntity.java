package to.bconnect.api.storage.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

/**
 * 참여자를 member FK 없이 minId·maxId로만 보유한다.
 * 상대가 탈퇴해도 채팅방은 유지되며, 목록 조회 시 상대 member는 null로 응답한다.
 */
@Entity
@Table(name = "direct_chats")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DirectChatEntity extends BaseEntity {

    private Long minId;

    private Long maxId;

    private Long minLastIdx;

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
