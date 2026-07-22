package to.bconnect.api.core.domain.board;

import to.bconnect.api.storage.board.BoardType;

public record CreateNote(
        BoardType type,
        Long projectId,
        Long driveId,
        String content
) {}
