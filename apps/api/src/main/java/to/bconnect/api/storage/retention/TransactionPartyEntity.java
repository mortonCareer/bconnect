package to.bconnect.api.storage.retention;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "transaction_parties")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@RetentionPolicy("P1Y")
public class TransactionPartyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long offerId;

    private Long memberId;

    private String memberName;

    private String memberPhone;

    private Long counterpartyId;

    private String counterpartyName;

    private String counterpartyPhone;

    private String counterpartyBrn;

    @Enumerated(EnumType.STRING)
    private TransactionPartyType counterpartyType;

    private Instant matchedAt;

    private Instant withdrawnAt;

    private Instant expireAt;

    public TransactionPartyEntity(
            Long offerId,
            Long memberId,
            String memberName,
            String memberPhone,
            Long counterpartyId,
            String counterpartyName,
            String counterpartyPhone,
            String counterpartyBrn,
            TransactionPartyType counterpartyType,
            Instant matchedAt
    ) {
        this.offerId = offerId;
        this.memberId = memberId;
        this.memberName = memberName;
        this.memberPhone = memberPhone;
        this.counterpartyId = counterpartyId;
        this.counterpartyName = counterpartyName;
        this.counterpartyPhone = counterpartyPhone;
        this.counterpartyBrn = counterpartyBrn;
        this.counterpartyType = counterpartyType;
        this.matchedAt = matchedAt;
    }

    public void withdraw(Instant withdrawnAt, Instant expireAt) {
        this.withdrawnAt = withdrawnAt;
        this.expireAt = expireAt;
    }
}
