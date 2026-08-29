package to.bconnect.api.storage.retention;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;
import to.bconnect.api.storage.member.MemberEntity;

import java.time.Instant;

@Entity
@Table(name = "retention_holds")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RetentionHoldEntity extends BaseEntity {

    private Long memberId;

    private String memberName;

    private String memberPhone;

    @Enumerated(EnumType.STRING)
    private RetentionHoldType type;

    private String reason;

    private Instant expireAt;

    private Instant withdrawnAt;

    public RetentionHoldEntity(Long memberId, RetentionHoldType type, String reason, Instant expireAt) {
        this.memberId = memberId;
        this.type = type;
        this.reason = reason;
        this.expireAt = expireAt;
    }

    public void archive(MemberEntity member, Instant withdrawnAt) {
        this.memberName = member.getName();
        this.memberPhone = member.getPhone();
        this.withdrawnAt = withdrawnAt;
    }
}
