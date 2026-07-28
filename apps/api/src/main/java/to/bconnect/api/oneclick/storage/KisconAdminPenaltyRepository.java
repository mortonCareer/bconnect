package to.bconnect.api.oneclick.storage;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// 키스콘 행정처분 저장소
public interface KisconAdminPenaltyRepository extends JpaRepository<KisconAdminPenaltyEntity, Long> {

    List<KisconAdminPenaltyEntity> findAllByBizRegNo(String bizRegNo);
}
