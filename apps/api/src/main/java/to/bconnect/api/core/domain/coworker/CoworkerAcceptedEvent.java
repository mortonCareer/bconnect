package to.bconnect.api.core.domain.coworker;

public record CoworkerAcceptedEvent(
        Long requesterId,
        Long accepterId
) { }
