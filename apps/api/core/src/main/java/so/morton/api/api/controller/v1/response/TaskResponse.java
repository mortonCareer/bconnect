package so.morton.api.api.controller.v1.response;

import so.morton.api.domain.task.Task;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.Trade;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record TaskResponse(
        Long id,
        Long profileId,
        String company,
        Address address,
        String taskTitle,
        String eventTitle,
        Set<Trade> trades,
        LocalDate start,
        LocalDate end,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static TaskResponse of(Task task) {
        return new TaskResponse(
                task.id(),
                task.profileId(),
                task.company(),
                task.address(),
                task.taskTitle(),
                task.eventTitle(),
                task.trades(),
                task.start(),
                task.end(),
                task.createdAt(),
                task.modifiedAt()
        );
    }
}
