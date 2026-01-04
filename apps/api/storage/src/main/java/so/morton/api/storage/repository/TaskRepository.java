package so.morton.api.storage.repository;

import so.morton.api.storage.entity.TaskEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import so.morton.api.storage.value.EntityStatus;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<TaskEntity, Long> {

    List<TaskEntity> findAllByStatus(EntityStatus status);

    List<TaskEntity> findByStartBetween(LocalDate start, LocalDate end);
}
