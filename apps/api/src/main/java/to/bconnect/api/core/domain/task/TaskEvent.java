package to.bconnect.api.core.domain.task;

public record TaskEvent(
        Long taskId,
        Long workerId,
        Long companyOwnerId
) {
}
