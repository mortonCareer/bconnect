package to.bconnect.api.storage.task;

import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

public enum TaskStatus {
    NONE,
    OPEN,
    OFFERED,
    ASSIGNED,
    ;

    public static final Set<TaskStatus> OFFERABLE =
            Collections.unmodifiableSet(EnumSet.of(NONE, OPEN, OFFERED));

    public static final Set<TaskStatus> ENGAGED =
            Collections.unmodifiableSet(EnumSet.of(OFFERED, ASSIGNED));
}
