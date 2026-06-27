package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.task.TaskStatus;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record TaskResponse(
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
        OfferSummaryResponse offer,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static TaskResponse of(Task task, Address address) {
        return of(task, address, (Offer) null);
    }

    public static TaskResponse of(Task task, Address address, Offer offer) {
        return new TaskResponse(
                task.id(),
                task.type(),
                task.trades(),
                task.start(),
                task.end(),
                task.status(),
                task.workerId(),
                task.workerTitle(),
                task.workerMemo(),
                task.workerCompany(),
                address,
                task.projectId(),
                task.projectTitle(),
                task.projectRequirement(),
                task.projectMemo(),
                offer == null ? null : OfferSummaryResponse.of(offer),
                task.createdAt(),
                task.modifiedAt()
        );
    }
}
