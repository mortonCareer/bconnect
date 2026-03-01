package so.morton.api.domain.task;

import so.morton.api.storage.support.Address;
import so.morton.api.storage.domain.task.TaskEntity;
import so.morton.api.storage.value.Trade;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record Task(
    Long id,
    Long profileId,
    // TODO: 삭제
    String company,
    Address address,
    // TODO: 추가
    // projectId: Long [nullable]
    String taskTitle,
    String eventTitle,
    Set<Trade> trades,
    LocalDate startDate,
    LocalDate endDate,
    // TODO: 추가
    // status: TaskStatus
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
    public static Task of(TaskEntity entity) {
        return new Task(
                entity.getId(),
                entity.getProfileId(),
                entity.getCompany(),
                entity.getAddress(),
                entity.getTaskTitle(),
                entity.getEventTitle(),
                entity.getTrades(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
