package to.bconnect.api.core.domain.drive;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.Attachment;
import to.bconnect.api.attachment.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.board.BoardEntity;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.BoardType;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.drive.DriveEntity;
import to.bconnect.api.storage.drive.DriveMemberEntity;
import to.bconnect.api.storage.drive.DriveMemberRepository;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.drive.DriveType;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class DriveService {

    private final DriveRepository driveRepository;
    private final DriveMemberRepository driveMemberRepository;
    private final DriveValidator driveValidator;
    private final AttachmentRepository attachmentRepository;
    private final AttachmentLinker attachmentLinker;
    private final BoardRepository boardRepository;
    private final NoteRepository noteRepository;

    @Transactional(readOnly = true)
    public List<Drive> listByMember(AuthUser user) {
        val owned = driveRepository.findAllByMemberId(user.id());
        val titles = driveMemberRepository.findAllByMemberId(user.id()).stream()
                .collect(Collectors.toMap(DriveMemberEntity::getDriveId, DriveMemberEntity::getTitle));
        val joined = driveRepository.findAllById(titles.keySet());

        return Stream.concat(
                owned.stream().map(it -> Drive.of(it, it.getTitle())),
                joined.stream().map(it -> Drive.of(it, titles.get(it.getId())))
        ).toList();
    }

    @Transactional(readOnly = true)
    public List<Drive> listByProject(AuthUser user, Long projectId) {
        if (!driveValidator.isProjectDriveOwner(user.id(), projectId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return driveRepository.findAllByProjectId(projectId).stream()
                .map(it -> Drive.of(it, it.getTitle()))
                .toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateDrive command) {
        Long projectId = null;
        Long memberId = null;

        if (command.type() == DriveType.PROJECT) {
            if (!driveValidator.isProjectDriveOwner(user.id(), command.projectId()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
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

        if (found.getType() == DriveType.MEMBER && driveValidator.isMemberDriveOwner(user.id(), found)) {
            found.update(title);
            return;
        }

        if (found.getType() == DriveType.PROJECT && driveValidator.isProjectDriveOwner(user.id(), found.getProjectId())) {
            found.update(title);
            return;
        }

        val driveMember = driveMemberRepository.findByDriveIdAndMemberId(driveId, user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.FORBIDDEN));
        driveMember.update(title);
    }

    @Transactional
    public void delete(AuthUser user, Long driveId) {
        val optional = driveRepository.findById(driveId);
        if (optional.isEmpty())
            return;
        val found = optional.get();

        if (found.getType() == DriveType.MEMBER && !driveValidator.isMemberDriveOwner(user.id(), found))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        if (found.getType() == DriveType.PROJECT && !driveValidator.isProjectDriveOwner(user.id(), found.getProjectId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        boardRepository.findByDriveId(driveId).ifPresent(board -> {
            noteRepository.deleteByBoardId(board.getId());
            boardRepository.delete(board);
        });
        attachmentLinker.unlink(ReferenceType.DRIVE, List.of(driveId));
        driveMemberRepository.deleteByDriveId(driveId);
        driveRepository.delete(found);
    }

    @Transactional(readOnly = true)
    public List<Attachment> listAttachments(AuthUser user, Long driveId, AttachmentType type) {
        driveValidator.validate(driveId, user.id());

        return Attachment.of(
                attachmentRepository.findAllByReferenceTypeAndReferenceIdAndType(ReferenceType.DRIVE, driveId, type));
    }
}
