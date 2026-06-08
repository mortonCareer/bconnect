package to.bconnect.api.core.domain.task;

import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.Set;

public record CreateTask(
        String company,
        Address address,
        String taskTitle,
        String eventTitle,
        Set<Trade> trades,
        LocalDate start,
        LocalDate end
) {}
