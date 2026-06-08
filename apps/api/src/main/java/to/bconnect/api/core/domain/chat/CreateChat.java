package to.bconnect.api.core.domain.chat;

import java.util.List;

public record CreateChat(
        String title,
        List<Long> participantIds
) {}
