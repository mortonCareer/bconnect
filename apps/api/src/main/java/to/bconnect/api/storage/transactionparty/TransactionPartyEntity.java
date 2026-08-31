package to.bconnect.api.storage.transactionparty;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.RetentionPolicy;

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

    private Long counterpartyMemberId;

    private String counterpartyName;

    private String counterpartyPhone;

    private String counterpartyBrn;

    @Enumerated(EnumType.STRING)
    private TransactionPartyType counterpartyType;

    private Instant matchedAt;

    private Instant withdrawnAt;

    private Instant expireAt;

    private Instant counterpartyWithdrawnAt;

    private Instant counterpartyExpireAt;

    public TransactionPartyEntity(
            Long offerId,
            Long memberId,
            String memberName,
            String memberPhone,
            Long counterpartyId,
            Long counterpartyMemberId,
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
        this.counterpartyMemberId = counterpartyMemberId;
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

    public void withdrawCounterparty(Instant withdrawnAt, Instant expireAt) {
        this.counterpartyWithdrawnAt = withdrawnAt;
        this.counterpartyExpireAt = expireAt;
    }
}
