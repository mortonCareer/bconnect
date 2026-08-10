package to.bconnect.api.oneclick.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 퇴직공제 가입 공사 저장소
public interface CwmaRetirementFundRepository extends JpaRepository<CwmaRetirementFundEntity, Long> {

    List<CwmaRetirementFundEntity> findAllByNormalizedCompanyName(String normalizedCompanyName);
}
