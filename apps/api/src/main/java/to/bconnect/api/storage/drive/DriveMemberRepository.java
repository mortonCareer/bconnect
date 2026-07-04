package to.bconnect.api.storage.drive;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DriveMemberRepository extends JpaRepository<DriveMemberEntity, Long> {

    Optional<DriveMemberEntity> findByDriveIdAndMemberId(Long driveId, Long memberId);

    List<DriveMemberEntity> findAllByMemberId(Long memberId);

    void deleteByDriveId(Long driveId);
}
