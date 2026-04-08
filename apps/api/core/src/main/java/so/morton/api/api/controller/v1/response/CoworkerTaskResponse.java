package so.morton.api.api.controller.v1.response;

import java.time.LocalDate;

public record CoworkerTaskResponse(
        Long id,
        Long profileId,
        LocalDate start,
        LocalDate end
) {}
