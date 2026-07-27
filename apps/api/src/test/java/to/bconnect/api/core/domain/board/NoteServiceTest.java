package to.bconnect.api.core.domain.board;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.BoardType;
import to.bconnect.api.storage.board.NoteEntity;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.drive.DriveMemberRepository;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.BoardFactory;
import to.bconnect.api.support.fixture.CompanyFactory;
import to.bconnect.api.support.fixture.DriveFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.ProjectFactory;
import to.bconnect.api.support.fixture.UserFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
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
        val board = boardRepository.save(BoardFactory.entity(project.getId(), null));
        val note1 = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val note2 = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), member.getId()));
        val driveBoard = boardRepository.save(BoardFactory.entity(null, drive.getId()));
        noteRepository.save(BoardFactory.noteEntity(driveBoard.getId(), member.getId()));

        // when
        val response = noteService.listByProject(UserFactory.domain(member.getId(), Role.CAREER), project.getId());

        // then
        assertThat(response).extracting(Note::id).containsExactlyInAnyOrder(note1.getId(), note2.getId());
        assertThat(response).extracting(Note::boardId).containsOnly(board.getId());
        assertThat(response).extracting(Note::memberId).containsOnly(member.getId());
        assertThat(response).extracting(Note::content).containsOnly("content");
    }

    @Test
    @DisplayName("listByProject - 프로젝트의 보드가 없을 때 조회하면 NOT_FOUND로 실패한다")
    void listByProject_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));

        // when & then
        assertCodeException(() -> noteService.listByProject(UserFactory.domain(member.getId(), Role.CAREER), project.getId()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("listByDrive - 소유한 드라이브의 보드일 때 조회하면 해당 보드의 노트만 반환한다")
    void listByDrive_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), member.getId()));
        val board = boardRepository.save(BoardFactory.entity(null, drive.getId()));
        val note1 = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val note2 = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val projectBoard = boardRepository.save(BoardFactory.entity(project.getId(), null));
        noteRepository.save(BoardFactory.noteEntity(projectBoard.getId(), member.getId()));

        val shared = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        driveMemberRepository.save(DriveFactory.memberEntity(drive.getId(), shared.getId()));

        // when
        val response = noteService.listByDrive(UserFactory.domain(member.getId(), Role.CAREER), drive.getId());
        val sharedResponse = noteService.listByDrive(UserFactory.domain(shared.getId(), Role.CAREER), drive.getId());

        // then
        assertThat(response).extracting(Note::id).containsExactlyInAnyOrder(note1.getId(), note2.getId());
        assertThat(response).extracting(Note::boardId).containsOnly(board.getId());
        assertThat(response).extracting(Note::memberId).containsOnly(member.getId());
        assertThat(response).extracting(Note::content).containsOnly("content");
        assertThat(sharedResponse).extracting(Note::id).containsExactlyInAnyOrder(note1.getId(), note2.getId());
    }

    @Test
    @DisplayName("listByDrive - 다른 업체의 드라이브일 때 조회하면 FORBIDDEN으로 실패한다")
    void listByDrive_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), owner.getId()));
        boardRepository.save(BoardFactory.entity(null, drive.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(new CompanyEntity(other.getId(), "company", "0000001001"));

        // when & then
        assertCodeException(() -> noteService.listByDrive(UserFactory.domain(other.getId(), Role.CAREER), drive.getId()))
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

        // when & then
        assertCodeException(() -> noteService.listByDrive(UserFactory.domain(member.getId(), Role.CAREER), drive.getId()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 소유한 프로젝트와 드라이브의 보드일 때 생성하면 각 보드에 노트가 저장된다")
    void create_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val projectBoard = boardRepository.save(BoardFactory.entity(project.getId(), null));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), member.getId()));
        val driveBoard = boardRepository.save(BoardFactory.entity(null, drive.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val createdOnProject = noteService.create(user, BoardFactory.command(project.getId(), null));
        val createdOnDrive = noteService.create(user, new CreateNote(BoardType.DRIVE, null, drive.getId(), "drive content"));

        // then
        val projectNote = noteRepository.findById(createdOnProject).orElseThrow();
        assertThat(projectNote.getBoardId()).isEqualTo(projectBoard.getId());
        assertThat(projectNote.getMemberId()).isEqualTo(member.getId());
        assertThat(projectNote.getContent()).isEqualTo("content");
        val driveNote = noteRepository.findById(createdOnDrive).orElseThrow();
        assertThat(driveNote.getBoardId()).isEqualTo(driveBoard.getId());
        assertThat(driveNote.getMemberId()).isEqualTo(member.getId());
        assertThat(driveNote.getContent()).isEqualTo("drive content");
    }

    @Test
    @DisplayName("create - 다른 업체의 드라이브일 때 생성하면 FORBIDDEN으로 실패한다")
    void create_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), owner.getId()));
        boardRepository.save(BoardFactory.entity(null, drive.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(new CompanyEntity(other.getId(), "company", "0000001001"));

        // when & then
        assertCodeException(() -> noteService.create(UserFactory.domain(other.getId(), Role.CAREER),
                new CreateNote(BoardType.DRIVE, null, drive.getId(), "content")))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("create - 프로젝트의 보드가 없을 때 생성하면 NOT_FOUND로 실패한다")
    void create_fail_C005_project() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));

        // when & then
        assertCodeException(() -> noteService.create(UserFactory.domain(member.getId(), Role.CAREER),
                BoardFactory.command(project.getId(), null)))
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

        // when & then
        assertCodeException(() -> noteService.create(UserFactory.domain(member.getId(), Role.CAREER),
                new CreateNote(BoardType.DRIVE, null, drive.getId(), "content")))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("update - 본인이 작성한 노트일 때 수정하면 내용이 갱신된다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.entity(project.getId(), null));
        val note = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));

        // when
        noteService.update(UserFactory.domain(member.getId(), Role.CAREER), note.getId(), "updated content");

        // then
        val found = noteRepository.findById(note.getId()).orElseThrow();
        assertThat(found.getContent()).isEqualTo("updated content");
        assertThat(found.getBoardId()).isEqualTo(board.getId());
        assertThat(found.getMemberId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("update - 다른 회원이 작성한 노트일 때 수정하면 FORBIDDEN으로 실패한다")
    void update_fail_C004() {
        // given
        val writer = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(writer.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.entity(project.getId(), null));
        val note = noteRepository.save(BoardFactory.noteEntity(board.getId(), writer.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when & then
        assertCodeException(() -> noteService.update(UserFactory.domain(other.getId(), Role.CAREER), note.getId(), "updated content"))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
        assertThat(noteRepository.findById(note.getId()).orElseThrow().getContent()).isEqualTo("content");
    }

    @Test
    @DisplayName("update - 노트가 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> noteService.update(UserFactory.domain(member.getId(), Role.CAREER), MISSING_ID, "updated content"))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 본인이 작성한 노트일 때 삭제하면 노트가 삭제되고 없는 노트는 무시한다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.entity(project.getId(), null));
        val note = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val kept = noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        noteService.delete(user, note.getId());

        // then
        assertThat(noteRepository.findById(note.getId())).isEmpty();
        assertThat(noteRepository.findAllByBoardId(board.getId())).extracting(NoteEntity::getId).containsExactly(kept.getId());
        assertThatCode(() -> noteService.delete(user, MISSING_ID)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("delete - 다른 회원이 작성한 노트일 때 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004() {
        // given
        val writer = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(writer.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val board = boardRepository.save(BoardFactory.entity(project.getId(), null));
        val note = noteRepository.save(BoardFactory.noteEntity(board.getId(), writer.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when & then
        assertCodeException(() -> noteService.delete(UserFactory.domain(other.getId(), Role.CAREER), note.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
        assertThat(noteRepository.findById(note.getId())).isPresent();
    }
}
