package to.bconnect.api.storage.notification;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "notification_types")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationTypeEntity extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationReferenceType referenceType;

    @Column(nullable = false)
    private String message;

    public NotificationTypeEntity(String code, NotificationReferenceType referenceType, String message) {
        this.code = code;
        this.referenceType = referenceType;
        this.message = message;
    }

    public void update(NotificationReferenceType referenceType, String message) {
        this.referenceType = referenceType;
        this.message = message;
    }
}
