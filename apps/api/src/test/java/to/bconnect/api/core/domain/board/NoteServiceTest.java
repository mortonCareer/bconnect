package to.bconnect.api.core.domain.board;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.drive.DriveMemberRepository;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.*;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class NoteServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private NoteService noteService;
    @Autowired private NoteRepository noteRepository;
    @Autowired private BoardRepository boardRepository;
    @Autowired private DriveRepository driveRepository;
    @Autowired private DriveMemberRepository driveMemberRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("listByProject - 소유한 프로젝트의 보드일 때 조회하면 해당 보드의 노트만 반환한다")
    void listByProject_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.projectEntity(project.getId()));
        val note1 = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val note2 = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val response = noteService.listByProject(user, project.getId());

        // then
        assertThat(response).extracting(Note::id).containsExactlyInAnyOrder(note1.getId(), note2.getId());
        assertThat(response).extracting(Note::boardId).containsOnly(board.getId());
    }

    @Test
    @DisplayName("listByDrive - 소유한 드라이브의 보드일 때 조회하면 해당 보드의 노트만 반환한다")
    void listByDrive_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), member.getId()));
        val board = boardRepository.save(BoardFactory.driveEntity(drive.getId()));
        val note1 = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val note2 = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val projectBoard = boardRepository.save(BoardFactory.projectEntity(project.getId()));
        noteRepository.save(BoardFactory.noteEntity(projectBoard.getId(), member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val response = noteService.listByDrive(user, drive.getId());

        // then
        assertThat(response).extracting(Note::id).containsExactlyInAnyOrder(note1.getId(), note2.getId());
        assertThat(response).extracting(Note::boardId).containsOnly(board.getId());
    }

    @Test
    @DisplayName("listByDrive - 드라이브를 공유받은 회원일 때 조회하면 해당 보드의 노트를 반환한다")
    void listByDrive_success_shared() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), owner.getId()));
        val board = boardRepository.save(BoardFactory.driveEntity(drive.getId()));
        val note1 = noteRepository.save(BoardFactory.noteEntity(board.getId(), owner.getId()));
        val note2 = noteRepository.save(BoardFactory.noteEntity(board.getId(), owner.getId()));
        val shared = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        driveMemberRepository.save(DriveFactory.memberEntity(drive.getId(), shared.getId()));
        val user = UserFactory.domain(shared.getId(), Role.CAREER);

        // when
        val response = noteService.listByDrive(user, drive.getId());

        // then
        assertThat(response).extracting(Note::id).containsExactlyInAnyOrder(note1.getId(), note2.getId());
        assertThat(response).extracting(Note::boardId).containsOnly(board.getId());
    }

    @Test
    @DisplayName("create - 소유한 프로젝트의 보드일 때 생성하면 해당 보드에 노트가 저장된다")
    void create_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.projectEntity(project.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = BoardFactory.projectCommand(project.getId());

        // when
        val created = noteService.create(user, command);

        // then
        val found = noteRepository.findById(created).orElseThrow();
        assertThat(found.getBoardId()).isEqualTo(board.getId());
        assertThat(found.getMemberId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("create - 소유한 드라이브의 보드일 때 생성하면 해당 보드에 노트가 저장된다")
    void create_success_drive() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), member.getId()));
        val board = boardRepository.save(BoardFactory.driveEntity(drive.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = BoardFactory.driveCommand(drive.getId());

        // when
        val created = noteService.create(user, command);

        // then
        val found = noteRepository.findById(created).orElseThrow();
        assertThat(found.getBoardId()).isEqualTo(board.getId());
        assertThat(found.getMemberId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("create - 드라이브를 공유받은 회원일 때 생성하면 해당 보드에 노트가 저장된다")
    void create_success_shared() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), owner.getId()));
        val board = boardRepository.save(BoardFactory.driveEntity(drive.getId()));

        val shared = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        driveMemberRepository.save(DriveFactory.memberEntity(drive.getId(), shared.getId()));
        val user = UserFactory.domain(shared.getId(), Role.CAREER);
        val command = BoardFactory.driveCommand(drive.getId());

        // when
        val created = noteService.create(user, command);

        // then
        val found = noteRepository.findById(created).orElseThrow();
        assertThat(found.getBoardId()).isEqualTo(board.getId());
        assertThat(found.getMemberId()).isEqualTo(shared.getId());
    }

    @Test
    @DisplayName("update - 본인이 작성한 노트일 때 수정하면 내용이 갱신된다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.projectEntity(project.getId()));
        val note = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        noteService.update(user, note.getId(), "updated content");

        // then
        val found = noteRepository.findById(note.getId()).orElseThrow();
        assertThat(found.getContent()).isEqualTo("updated content");
    }

    @Test
    @DisplayName("delete - 본인이 작성한 노트일 때 삭제하면 해당 노트만 삭제된다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.projectEntity(project.getId()));
        val note = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        noteService.delete(user, note.getId());

        // then
        assertThat(noteRepository.findById(note.getId())).isEmpty();
    }

    @Test
    @DisplayName("listByProject - 프로젝트의 보드가 없을 때 조회하면 NOT_FOUND로 실패한다")
    void listByProject_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> noteService.listByProject(user, project.getId()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("listByDrive - 다른 업체의 드라이브일 때 조회하면 FORBIDDEN으로 실패한다")
    void listByDrive_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), owner.getId()));
        boardRepository.save(BoardFactory.driveEntity(drive.getId()));

        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(other.getId(), "0000001001"));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> noteService.listByDrive(user, drive.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("listByDrive - 드라이브의 보드가 없을 때 조회하면 NOT_FOUND로 실패한다")
    void listByDrive_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> noteService.listByDrive(user, drive.getId()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 다른 업체의 드라이브일 때 생성하면 FORBIDDEN으로 실패한다")
    void create_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), owner.getId()));
        boardRepository.save(BoardFactory.driveEntity(drive.getId()));

        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(other.getId(), "0000001001"));
        val user = UserFactory.domain(other.getId(), Role.CAREER);
        val command = BoardFactory.driveCommand(drive.getId());

        // when & then
        assertCodeException(() -> noteService.create(user, command))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("create - 프로젝트의 보드가 없을 때 생성하면 NOT_FOUND로 실패한다")
    void create_fail_C005_project() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = BoardFactory.projectCommand(project.getId());

        // when & then
        assertCodeException(() -> noteService.create(user, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 드라이브의 보드가 없을 때 생성하면 NOT_FOUND로 실패한다")
    void create_fail_C005_drive() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = BoardFactory.driveCommand(drive.getId());

        // when & then
        assertCodeException(() -> noteService.create(user, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("update - 다른 회원이 작성한 노트일 때 수정하면 FORBIDDEN으로 실패한다")
    void update_fail_C004() {
        // given
        val writer = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(writer.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.projectEntity(project.getId()));
        val note = noteRepository.save(BoardFactory.noteEntity(board.getId(), writer.getId()));

        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> noteService.update(user, note.getId(), "updated content"))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("update - 노트가 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> noteService.update(user, MISSING_ID, "updated content"))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 다른 회원이 작성한 노트일 때 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004() {
        // given
        val writer = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(writer.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.projectEntity(project.getId()));
        val note = noteRepository.save(BoardFactory.noteEntity(board.getId(), writer.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> noteService.delete(user, note.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
        assertThat(noteRepository.findById(note.getId())).isPresent();
    }
}
