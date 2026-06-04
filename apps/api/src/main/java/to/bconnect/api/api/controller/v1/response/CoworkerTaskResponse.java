package to.bconnect.api.api.controller.v1.response;

import to.bconnect.api.domain.task.Task;

import java.time.LocalDate;

public record CoworkerTaskResponse(
        Long id,
        Long profileId,
        LocalDate start,
        LocalDate end
) {
    public static CoworkerTaskResponse of(Task task) {
        return new CoworkerTaskResponse(task.id(), task.profileId(), task.start(), task.end());
    }
}
