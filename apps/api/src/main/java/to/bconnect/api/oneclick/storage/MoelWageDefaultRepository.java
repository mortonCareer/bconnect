package to.bconnect.api.oneclick.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 고용노동부 체불사업주 저장소
public interface MoelWageDefaultRepository extends JpaRepository<MoelWageDefaultEntity, Long> {

    List<MoelWageDefaultEntity> findAllByNormalizedCompanyName(String normalizedCompanyName);
}
