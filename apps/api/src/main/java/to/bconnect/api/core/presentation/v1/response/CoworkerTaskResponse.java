package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.task.Task;

import java.time.LocalDate;

public record CoworkerTaskResponse(
        Long id,
        Long memberId,
        LocalDate start,
        LocalDate end
) {
    public static CoworkerTaskResponse of(Task task) {
        return new CoworkerTaskResponse(task.id(), task.memberId(), task.start(), task.end());
    }
}
