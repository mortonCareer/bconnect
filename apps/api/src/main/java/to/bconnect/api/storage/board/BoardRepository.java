package to.bconnect.api.storage.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BoardRepository extends JpaRepository<BoardEntity, Long> {

    Optional<BoardEntity> findByProjectId(Long projectId);

    Optional<BoardEntity> findByDriveId(Long driveId);
}
