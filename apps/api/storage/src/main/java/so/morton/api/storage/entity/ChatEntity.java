package so.morton.api.storage.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "chats")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatEntity extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Builder
    public ChatEntity(String title) {
        this.title = title;
    }
}
