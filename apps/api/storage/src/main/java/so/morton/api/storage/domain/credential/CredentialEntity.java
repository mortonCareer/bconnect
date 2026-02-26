package so.morton.api.storage.domain.credential;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import so.morton.api.storage.support.BaseEntity;
import so.morton.api.storage.value.CredentialStatus;
import so.morton.api.storage.value.CredentialType;

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

    @Builder
    public CredentialEntity(Long profileId, CredentialType type) {
        this.profileId = profileId;
        this.type = type;
    }

    public void accept() {
        this.status = CredentialStatus.ACCEPTED;
    }

    public void deny() {
        this.status = CredentialStatus.DENIED;
    }

    public void renew() {
        this.status = CredentialStatus.PENDING;
    }
}