package to.bconnect.api.storage.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<TaskEntity, Long> {
    List<TaskEntity> findAllByWorkerId(Long workerId);

    List<TaskEntity> findAllByWorkerIdAndType(Long workerId, TaskType type);

    List<TaskEntity> findAllByProjectId(Long projectId);

    void deleteAllByProjectId(Long projectId);
}
