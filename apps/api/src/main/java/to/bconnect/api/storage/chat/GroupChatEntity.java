package to.bconnect.api.storage.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "group_chats")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GroupChatEntity extends BaseEntity {

    @Column(nullable = false)
    private String title;

    public GroupChatEntity(String title) {
        this.title = title;
    }
}
