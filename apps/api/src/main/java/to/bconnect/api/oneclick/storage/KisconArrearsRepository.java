package to.bconnect.api.oneclick.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 키스콘 상습체불 저장소
public interface KisconArrearsRepository extends JpaRepository<KisconArrearsEntity, Long> {

    List<KisconArrearsEntity> findAllByNormalizedCompanyName(String normalizedCompanyName);
}
