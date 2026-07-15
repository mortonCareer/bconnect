package to.bconnect.api.core.domain.task;

import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskStatus;
import to.bconnect.api.storage.task.TaskType;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;

public record Task(
        Long id,
        TaskType type,
        Set<Trade> trades,
        LocalDate start,
        LocalDate end,
        TaskStatus status,
        Long workerId,
        String workerTitle,
        String workerMemo,
        String workerCompany,
        Address address,
        Long projectId,
        String projectTitle,
        String projectRequirement,
        String projectMemo,
        OffsetDateTime createdAt,
        OffsetDateTime modifiedAt
) {
    public static Task of(TaskEntity entity) {
        return new Task(
                entity.getId(),
                entity.getType(),
                entity.getTrades(),
                entity.getStart(),
                entity.getEnd(),
                entity.getStatus(),
                entity.getWorkerId(),
                entity.getWorkerTitle(),
                entity.getWorkerMemo(),
                entity.getWorkerCompany(),
                entity.getAddress(),
                entity.getProjectId(),
                entity.getProjectTitle(),
                entity.getProjectRequirement(),
                entity.getProjectMemo(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
