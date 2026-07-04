package to.bconnect.api.core.domain.board;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.drive.DriveValidator;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.board.BoardEntity;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.BoardType;
import to.bconnect.api.storage.board.NoteEntity;
import to.bconnect.api.storage.board.NoteRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final BoardRepository boardRepository;
    private final DriveValidator driveValidator;

    @Transactional(readOnly = true)
    public List<Note> listByProject(AuthUser user, Long projectId) {
        val board = boardRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!driveValidator.isProjectDriveOwner(user.id(), projectId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return noteRepository.findAllByBoardId(board.getId()).stream()
                .map(Note::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Note> listByDrive(AuthUser user, Long driveId) {
        val board = boardRepository.findByDriveId(driveId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        driveValidator.validate(driveId, user.id());

        return noteRepository.findAllByBoardId(board.getId()).stream()
                .map(Note::of)
                .toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateNote command) {
        BoardEntity board;

        if (command.type() == BoardType.PROJECT) {
            board = boardRepository.findByProjectId(command.projectId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            if (!driveValidator.isProjectDriveOwner(user.id(), command.projectId()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        } else {
            board = boardRepository.findByDriveId(command.driveId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            driveValidator.validate(command.driveId(), user.id());
        }

        return noteRepository.save(new NoteEntity(board.getId(), user.id(), command.content())).getId();
    }

    @Transactional
    public void update(AuthUser user, Long noteId, String content) {
        val found = noteRepository.findById(noteId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(AuthUser user, Long noteId) {
        val optional = noteRepository.findById(noteId);
        if (optional.isEmpty())
            return;
        val found = optional.get();

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        noteRepository.delete(found);
    }
}
