package to.bconnect.api.core.domain.board;

import to.bconnect.api.storage.board.NoteEntity;

import java.time.LocalDateTime;

public record Note(
        Long id,
        Long boardId,
        Long memberId,
        String content,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt
) {
    public static Note of(NoteEntity entity) {
        return new Note(
                entity.getId(),
                entity.getBoardId(),
                entity.getMemberId(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
