package so.morton.api.storage.support;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import so.morton.api.storage.value.EntityStatus;

import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@EqualsAndHashCode(of = "id")
@EntityListeners(AuditingEntityListener.class)
public class BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long id;

    @CreatedDate
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime modifiedAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private EntityStatus status = EntityStatus.ACTIVE;

    public void delete() {
        this.status = EntityStatus.DELETED;
    }
}
