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

    @Column(nullable = false)
    private Long memberId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CredentialType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CredentialStatus status = CredentialStatus.PENDING;

    private LocalDate expiredAt;

    // TODO 파일 첨부

    public CredentialEntity(Long memberId, CredentialType type, LocalDate expiredAt) {
        this.memberId = memberId;
        this.type = type;
        this.expiredAt = expiredAt;
    }

    public void accept() {
        this.status = CredentialStatus.ACCEPTED;
    }

    public void deny() {
        this.status = CredentialStatus.DENIED;
    }
}