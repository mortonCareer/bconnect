package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.board.CreateNote;
import to.bconnect.api.core.domain.board.Note;
import to.bconnect.api.storage.board.BoardEntity;
import to.bconnect.api.storage.board.BoardType;
import to.bconnect.api.storage.board.NoteEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class BoardFactory {

    public static Note domain(Long id, Long boardId, Long memberId) {
        return new Note(id, boardId, memberId, "content",
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static CreateNote command(Long projectId, Long driveId) {
        return new CreateNote(BoardType.PROJECT, projectId, driveId, "content");
    }

    public static BoardEntity entity(Long projectId, Long driveId) {
        return new BoardEntity(
                BoardType.PROJECT,
                projectId,
                driveId
        );
    }

    public static NoteEntity noteEntity(Long boardId, Long memberId) {
        return new NoteEntity(
                boardId,
                memberId,
                "content"
        );
    }
}
