package to.bconnect.api.storage.domain.credential;

import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import to.bconnect.api.storage.BaseEntity;
import to.bconnect.api.storage.value.CredentialStatus;
import to.bconnect.api.storage.value.CredentialType;

@Entity
@Table(name = "credentials")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CredentialEntity extends BaseEntity {

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CredentialType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CredentialStatus status = CredentialStatus.PENDING;

    private LocalDate expiredAt;

    // TODO 파일 첨부

    @Builder
    public CredentialEntity(Long profileId, CredentialType type, LocalDate expiredAt) {
        this.profileId = profileId;
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