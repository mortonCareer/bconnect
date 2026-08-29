package to.bconnect.api.core.domain.project;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.company.CompanyExceptionCode;
import to.bconnect.api.core.domain.task.TaskExceptionCode;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.BoardType;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.drive.DriveRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.*;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class ProjectServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private ProjectService projectService;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private BoardRepository boardRepository;
    @Autowired private NoteRepository noteRepository;
    @Autowired private OfferRepository offerRepository;
    @Autowired private PostRepository postRepository;
    @Autowired private DriveRepository driveRepository;

    @Test
    @DisplayName("get - 소유한 업체의 프로젝트일 때 조회하면 프로젝트를 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val found = projectService.get(user, project.getId());

        // then
        assertThat(found.id()).isEqualTo(project.getId());
        assertThat(found.companyId()).isEqualTo(company.getId());
    }

    @Test
    @DisplayName("list - 소유한 업체가 있을 때 목록을 조회하면 업체의 프로젝트 목록을 반환한다")
    void list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val response = projectService.list(user);

        // then
        assertThat(response).extracting(Project::id).containsExactly(project.getId());
    }

    @Test
    @DisplayName("create - 소유한 업체가 있을 때 생성하면 프로젝트와 보드가 저장된다")
    void create_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = ProjectFactory.createCommand();

        // when
        val created = projectService.create(user, command);

        // then
        val found = projectRepository.findById(created).orElseThrow();
        assertThat(found.getCompanyId()).isEqualTo(company.getId());
        val board = boardRepository.findByProjectId(created).orElseThrow();
        assertThat(board.getType()).isEqualTo(BoardType.PROJECT);
    }

    @Test
    @DisplayName("update - 소유한 업체의 프로젝트일 때 수정하면 제목과 주소가 갱신된다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = ProjectFactory.updateCommand();

        // when
        projectService.update(user, project.getId(), command);

        // then
        val found = projectRepository.findById(project.getId()).orElseThrow();
        assertThat(found.getTitle()).isEqualTo(command.title());
        assertThat(found.getAddress().getZipcode()).isEqualTo(command.address().getZipcode());
    }

    @Test
    @DisplayName("delete - 소유한 업체의 프로젝트일 때 삭제하면 태스크·보드·노트가 함께 삭제된다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val offer = offerRepository.save(OfferFactory.entity(task.getId(), member.getId()));
        val post = postRepository.save(PostFactory.entity(member.getId(), task.getId()));
        val board = boardRepository.save(BoardFactory.projectEntity(project.getId()));
        noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));
        val drive = driveRepository.save(DriveFactory.entity(project.getId(), null));
        val driveBoard = boardRepository.save(BoardFactory.driveEntity(drive.getId()));
        noteRepository.save(BoardFactory.noteEntity(driveBoard.getId(), member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        projectService.delete(user, project.getId());

        // then
        assertThat(projectRepository.findById(project.getId())).isEmpty();
        assertThat(taskRepository.findAllByProjectIdOrderByIdAsc(project.getId())).isEmpty();
        assertThat(offerRepository.findById(offer.getId())).isEmpty();
        assertThat(postRepository.findById(post.getId()).orElseThrow().getTaskId()).isNull();
        assertThat(driveRepository.findById(drive.getId())).isEmpty();
        assertThat(boardRepository.findByDriveId(drive.getId())).isEmpty();
        assertThat(boardRepository.findByProjectId(project.getId())).isEmpty();
        assertThat(noteRepository.findAllByBoardIdOrderByIdDesc(board.getId())).isEmpty();
    }

    @Test
    @DisplayName("get - 다른 업체의 프로젝트일 때 조회하면 FORBIDDEN으로 실패한다")
    void get_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(other.getId(), "0000001001"));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> projectService.get(user, project.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("get - 프로젝트가 존재하지 않을 때 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005_project() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> projectService.get(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("get - 소유한 업체가 없을 때 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005_company() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> projectService.get(user, project.getId()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 소유한 업체가 없을 때 생성하면 NOT_FOUND로 실패한다")
    void create_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = ProjectFactory.createCommand();

        // when & then
        assertCodeException(() -> projectService.create(user, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 업체가 프로젝트 한도일 때 생성하면 PROJECT_LIMIT_EXCEEDED로 실패한다")
    void create_fail_CO003() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        projectRepository.save(ProjectFactory.entity(company.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = ProjectFactory.createCommand();

        // when & then
        assertCodeException(() -> projectService.create(user, command))
                .hasExceptionCode(CompanyExceptionCode.PROJECT_LIMIT_EXCEEDED);
    }

    @Test
    @DisplayName("update - 다른 업체의 프로젝트일 때 수정하면 FORBIDDEN으로 실패한다")
    void update_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(other.getId(), "0000001001"));
        val user = UserFactory.domain(other.getId(), Role.CAREER);
        val command = ProjectFactory.updateCommand();

        // when & then
        assertCodeException(() -> projectService.update(user, project.getId(), command))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("update - 프로젝트가 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005_project() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = ProjectFactory.updateCommand();

        // when & then
        assertCodeException(() -> projectService.update(user, MISSING_ID, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("update - 소유한 업체가 없을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005_company() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(other.getId(), Role.CAREER);
        val command = ProjectFactory.updateCommand();

        // when & then
        assertCodeException(() -> projectService.update(user, project.getId(), command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 다른 업체의 프로젝트일 때 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(other.getId(), "0000001001"));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> projectService.delete(user, project.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("delete - 프로젝트가 존재하지 않을 때 삭제하면 NOT_FOUND로 실패한다")
    void delete_fail_C005_project() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> projectService.delete(user, MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 소유한 업체가 없을 때 삭제하면 NOT_FOUND로 실패한다")
    void delete_fail_C005_company() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> projectService.delete(user, project.getId()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 섭외 중인 작업이 있을 때 삭제하면 OFFERED_EXISTS로 실패한다")
    void delete_fail_T003() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        task.offered();
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> projectService.delete(user, project.getId()))
                .hasExceptionCode(TaskExceptionCode.OFFERED_EXISTS);
    }
}
