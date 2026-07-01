package to.bconnect.api.core.domain.chat;

import java.util.List;

public record CreateGroupChat(
    String title,
    List<Long> participantIds
) {}
