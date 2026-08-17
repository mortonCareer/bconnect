package to.bconnect.api.storage.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM task_trades WHERE task_id IN (SELECT id FROM tasks WHERE worker_id = :memberId AND dtype = 'WORKER')", nativeQuery = true)
    int purgeWorkerTradesByWorkerId(@Param("memberId") Long memberId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM tasks WHERE worker_id = :memberId AND dtype = 'WORKER'", nativeQuery = true)
    int purgeWorkerByWorkerId(@Param("memberId") Long memberId);
}
