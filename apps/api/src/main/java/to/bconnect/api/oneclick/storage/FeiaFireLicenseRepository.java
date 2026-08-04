package to.bconnect.api.oneclick.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 소방시설업체 저장소
public interface FeiaFireLicenseRepository extends JpaRepository<FeiaFireLicenseEntity, Long> {

    List<FeiaFireLicenseEntity> findAllByNormalizedCompanyName(String normalizedCompanyName);
}
