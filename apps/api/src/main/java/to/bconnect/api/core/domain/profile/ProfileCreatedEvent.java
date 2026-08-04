package to.bconnect.api.core.domain.profile;

public record ProfileCreatedEvent(
        Long memberId,
        Long profileId
) { }
