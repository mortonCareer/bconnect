package to.bconnect.api.oneclick.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 전기공사업체 저장소
public interface EcicElectricalLicenseRepository extends JpaRepository<EcicElectricalLicenseEntity, Long> {

    List<EcicElectricalLicenseEntity> findAllByNormalizedCompanyName(String normalizedCompanyName);
}
