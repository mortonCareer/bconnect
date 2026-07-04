package to.bconnect.api.storage.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "messages")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MessageEntity extends BaseEntity {

    private Long chatId;

    @Enumerated(EnumType.STRING)
    private ChatType chatType;

    private Long memberId;

    @Enumerated(EnumType.STRING)
    private MessageType type;

    private String content;
}
