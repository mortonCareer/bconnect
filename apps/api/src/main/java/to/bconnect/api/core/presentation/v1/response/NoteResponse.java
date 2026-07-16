package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.board.Note;

import java.time.LocalDateTime;

public record NoteResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long memberId,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String content,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime modifiedAt
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
