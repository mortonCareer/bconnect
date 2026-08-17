package to.bconnect.api.storage.retention;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "abuse_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AbuseRecordEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long memberId;

    private String phone;

    private String reason;

    private Instant archivedAt;

    private Instant expireAt;

    public AbuseRecordEntity(Long memberId, String phone, String reason, Instant archivedAt, Instant expireAt) {
        this.memberId = memberId;
        this.phone = phone;
        this.reason = reason;
        this.archivedAt = archivedAt;
        this.expireAt = expireAt;
    }
}
