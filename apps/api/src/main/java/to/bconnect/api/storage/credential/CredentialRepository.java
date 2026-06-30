package to.bconnect.api.storage.credential;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CredentialRepository extends JpaRepository<CredentialEntity, Long> {

    List<CredentialEntity> findByMemberId(Long memberId);
}
