package to.bconnect.api.storage.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface TaskRepository extends JpaRepository<TaskEntity, Long> {
    List<TaskEntity> findAllByWorkerIdOrderByIdDesc(Long workerId);

    List<TaskEntity> findAllByWorkerIdAndType(Long workerId, TaskType type);

    List<TaskEntity> findAllByWorkerIdAndTypeOrderByIdDesc(Long workerId, TaskType type);

    List<TaskEntity> findAllByProjectIdOrderByIdAsc(Long projectId);

    List<TaskEntity> findAllByProjectIdAndWorkerIdNotNullOrderByIdAsc(Long projectId);

    boolean existsByProjectIdInAndProgress(Collection<Long> projectIds, TaskProgress progress);

    boolean existsByProjectIdInAndStatusIn(Collection<Long> projectIds, Collection<TaskStatus> statuses);

    void deleteAllByProjectId(Long projectId);
}
