package to.bconnect.api.core.domain.task;

import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

public record Task(
    Long id,
    Long memberId,
    // TODO: 삭제
    String company,
    Address address,
    // TODO: 추가
    // projectId: Long [nullable]
    String taskTitle,
    String eventTitle,
    Set<Trade> trades,
    LocalDate start,
    LocalDate end,
    // TODO: 추가
    // status: TaskStatus
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {}
