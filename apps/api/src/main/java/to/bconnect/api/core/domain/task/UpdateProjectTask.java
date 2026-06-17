package to.bconnect.api.core.domain.task;

import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDate;
import java.util.Set;

public record UpdateProjectTask(
        Set<Trade> trades,
        LocalDate start,
        LocalDate end,
        String title,
        String requirement,
        String memo
) {}
