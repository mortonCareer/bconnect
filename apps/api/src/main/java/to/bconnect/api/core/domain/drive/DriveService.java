package to.bconnect.api.core.domain.drive;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.project.ProjectFinder;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.board.BoardEntity;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.BoardType;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.drive.*;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class DriveService {

    private final DriveRepository driveRepository;
    private final DriveMemberRepository driveMemberRepository;
    private final DriveFinder driveFinder;
    private final DriveFileService driveFileService;
    private final BoardRepository boardRepository;
    private final NoteRepository noteRepository;
    private final ProjectFinder projectFinder;

    @Transactional(readOnly = true)
    public List<Drive> listByMember(AuthUser user) {
        val owned = driveRepository.findAllByMemberId(user.id());
        val titles = driveMemberRepository.findAllByMemberId(user.id()).stream()
                .collect(Collectors.toMap(DriveMemberEntity::getDriveId, DriveMemberEntity::getTitle));
        val joined = driveRepository.findAllById(titles.keySet());

        return Stream.concat(
                owned.stream().map(it -> Drive.of(it, it.getTitle())),
                joined.stream().map(it -> Drive.of(it, titles.get(it.getId())))
        ).sorted(Comparator.comparing(Drive::id)).toList();
    }

    @Transactional(readOnly = true)
    public List<Drive> listByProject(AuthUser user, Long projectId) {
        projectFinder.validateOwnership(user.id(), projectId);
        return driveRepository.findAllByProjectIdOrderByIdAsc(projectId).stream()
                .map(it -> Drive.of(it, it.getTitle()))
                .toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateDrive command) {
        Long projectId = null;
        Long memberId = null;

        if (command.type() == DriveType.PROJECT) {
            projectFinder.validateOwnership(user.id(), command.projectId());
            projectId = command.projectId();
        } else {
            memberId = user.id();
        }

        val created = driveRepository.save(new DriveEntity(command.type(), projectId, memberId, command.title()));
        boardRepository.save(new BoardEntity(BoardType.DRIVE, null, created.getId()));
        return created.getId();
    }

    @Transactional
    public void rename(AuthUser user, Long driveId, String title) {
        val found = driveRepository.findById(driveId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val optional = driveMemberRepository.findByDriveIdAndMemberId(driveId, user.id());
        if (optional.isPresent()) {
            optional.get().update(title);
            return;
        }

        if (!driveFinder.isOwner(user.id(), found.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        found.update(title);
    }

    @Transactional
    public void delete(AuthUser user, Long driveId) {
        val optional = driveRepository.findById(driveId);
        if (optional.isEmpty())
            return;

        val found = optional.get();
        if (!driveFinder.isOwner(user.id(), found.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        delete(found);
    }

    @Transactional
    public void delete(DriveEntity drive) {
        boardRepository.findByDriveId(drive.getId()).ifPresent(board -> {
            noteRepository.deleteAllByBoardId(board.getId());
            boardRepository.delete(board);
        });
        driveFileService.detachAll(drive);
        driveMemberRepository.deleteByDriveId(drive.getId());
        driveRepository.delete(drive);
    }
}
