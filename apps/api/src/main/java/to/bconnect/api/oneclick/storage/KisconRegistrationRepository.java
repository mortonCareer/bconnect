package to.bconnect.api.oneclick.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 키스콘 건설업 등록 저장소
public interface KisconRegistrationRepository extends JpaRepository<KisconRegistrationEntity, Long> {

    List<KisconRegistrationEntity> findAllByBizRegNo(String bizRegNo);
}
