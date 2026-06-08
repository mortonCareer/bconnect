package to.bconnect.api.storage.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "chats")
@Getter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatEntity extends BaseEntity {

    @Column(nullable = false)
    private String title;
}
