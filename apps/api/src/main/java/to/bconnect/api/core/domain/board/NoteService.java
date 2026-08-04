package to.bconnect.api.core.domain.board;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.drive.DriveFinder;
import to.bconnect.api.core.domain.project.ProjectFinder;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.board.*;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final BoardRepository boardRepository;
    private final DriveFinder driveFinder;
    private final ProjectFinder projectFinder;

    @Transactional(readOnly = true)
    public List<Note> listByProject(AuthUser user, Long projectId) {
        val board = boardRepository.findByProjectId(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        projectFinder.validateOwnership(user.id(), projectId);

        return noteRepository.findAllByBoardIdOrderByIdDesc(board.getId()).stream()
                .map(Note::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Note> listByDrive(AuthUser user, Long driveId) {
        val board = boardRepository.findByDriveId(driveId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!driveFinder.isMember(user.id(), driveId) && !driveFinder.isOwner(user.id(), driveId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return noteRepository.findAllByBoardIdOrderByIdDesc(board.getId()).stream()
                .map(Note::of)
                .toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateNote command) {
        BoardEntity board;

        if (command.type() == BoardType.PROJECT) {
            board = boardRepository.findByProjectId(command.projectId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

            projectFinder.validateOwnership(user.id(), command.projectId());
        } else if (command.type() == BoardType.DRIVE) {
            board = boardRepository.findByDriveId(command.driveId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

            if (!driveFinder.isMember(user.id(), command.driveId()) && !driveFinder.isOwner(user.id(), command.driveId()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        } else {
            throw new CodeException(CommonExceptionCode.NOT_VALID);
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
