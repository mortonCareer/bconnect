package to.bconnect.api.storage.credential;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;

@Entity
@Table(name = "credentials")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CredentialEntity extends BaseEntity {

    private Long memberId;

    @Enumerated(EnumType.STRING)
    private CredentialType type;

    @Enumerated(EnumType.STRING)
    private CredentialStatus status = CredentialStatus.PENDING;

    private LocalDate expiredAt;

    private String note;

    public CredentialEntity(Long memberId, CredentialType type, LocalDate expiredAt, String note) {
        this.memberId = memberId;
        this.type = type;
        this.expiredAt = expiredAt;
        this.note = note;
    }

    public void accept() {
        this.status = CredentialStatus.ACCEPTED;
    }

    public void deny() {
        this.status = CredentialStatus.DENIED;
    }
}