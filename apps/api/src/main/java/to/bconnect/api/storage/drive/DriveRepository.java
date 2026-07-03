package to.bconnect.api.storage.drive;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DriveRepository extends JpaRepository<DriveEntity, Long> {
    List<DriveEntity> findAllByMemberId(Long memberId);

    List<DriveEntity> findAllByProjectId(Long projectId);
}
