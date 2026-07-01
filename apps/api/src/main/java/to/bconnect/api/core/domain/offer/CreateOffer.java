package to.bconnect.api.core.domain.offer;

import java.time.LocalDate;

public record CreateOffer(
        Long taskId,
        Long workerId,
        LocalDate due
) { }
