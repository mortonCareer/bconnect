package to.bconnect.api.core.domain.task;

import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.task.TaskProgress;

import java.time.LocalDate;
import java.util.Set;

public record UpdateWorkerTask(
        Set<Trade> trades,
        LocalDate start,
        LocalDate end,
        TaskProgress progress,
        String title,
        String memo,
        String company,
        Address address
) {}
