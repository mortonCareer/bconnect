package to.bconnect.api.core.domain.coworker;

public record CoworkerAcceptedEvent(
        Long fromId,
        Long toId
) { }
