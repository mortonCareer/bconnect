package so.morton.api.storage.domain.task;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<TaskEntity, Long> {

    List<TaskEntity> findAllByDeletedFalse();

    List<TaskEntity> findByStartBetween(LocalDate start, LocalDate end);
}
