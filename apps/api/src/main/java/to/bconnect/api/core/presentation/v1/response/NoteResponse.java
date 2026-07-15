package to.bconnect.api.core.presentation.v1.response;

import to.bconnect.api.core.domain.board.Note;

import java.time.OffsetDateTime;

public record NoteResponse(
        Long id,
        Long memberId,
        String content,
        OffsetDateTime createdAt,
        OffsetDateTime modifiedAt
) {
    public static NoteResponse of(Note note) {
        return new NoteResponse(
                note.id(),
                note.memberId(),
                note.content(),
                note.createdAt(),
                note.modifiedAt()
        );
    }
}
