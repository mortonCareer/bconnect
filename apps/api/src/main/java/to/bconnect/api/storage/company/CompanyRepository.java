package to.bconnect.api.storage.company;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<CompanyEntity, Long> {

    Optional<CompanyEntity> findByMemberId(Long memberId);

    boolean existsByMemberId(Long memberId);

    boolean existsByBrn(String brn);
}
