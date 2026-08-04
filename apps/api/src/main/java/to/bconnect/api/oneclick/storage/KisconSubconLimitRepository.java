package to.bconnect.api.oneclick.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 키스콘 하도급 참여제한 저장소
public interface KisconSubconLimitRepository extends JpaRepository<KisconSubconLimitEntity, Long> {

    List<KisconSubconLimitEntity> findAllByBizRegNo(String bizRegNo);

    List<KisconSubconLimitEntity> findAllByNormalizedCompanyName(String normalizedCompanyName);
}
