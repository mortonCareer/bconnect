package to.bconnect.api.storage.drive;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DriveMemberRepository extends JpaRepository<DriveMemberEntity, Long> {

    boolean existsByDriveIdAndMemberId(Long driveId, Long memberId);

    List<DriveMemberEntity> findByDriveId(Long driveId);

    List<DriveMemberEntity> findByMemberId(Long memberId);

    void deleteByDriveId(Long driveId);
}
