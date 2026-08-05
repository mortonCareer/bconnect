package to.bconnect.api.core.domain.task;

import to.bconnect.api.storage.task.TaskProgress;

public record UpdateAssigneeTask(
        TaskProgress progress,
        String title,
        String memo
) {}
