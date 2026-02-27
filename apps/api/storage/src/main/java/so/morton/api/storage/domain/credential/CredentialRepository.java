package so.morton.api.storage.domain.credential;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CredentialRepository extends JpaRepository<CredentialEntity, Long> {

    List<CredentialEntity> findByProfileId(Long profileId);
}
