package to.bconnect.api.core.domain.project;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.company.CompanyExceptionCode;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.BoardType;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.BoardFactory;
import to.bconnect.api.support.fixture.CompanyFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.ProjectFactory;
import to.bconnect.api.support.fixture.UserFactory;

import java.time.LocalDate;
import java.util.Set;

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

    @Test
    @DisplayName("get - 소유한 업체의 프로젝트일 때 조회하면 프로젝트를 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));

        // when
        val found = projectService.get(UserFactory.domain(member.getId(), Role.CAREER), project.getId());

        // then
        assertThat(found.id()).isEqualTo(project.getId());
        assertThat(found.companyId()).isEqualTo(company.getId());
        assertThat(found.title()).isEqualTo("title");
    }

    @Test
    @DisplayName("get - 다른 업체의 프로젝트일 때 조회하면 FORBIDDEN으로 실패한다")
    void get_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(new CompanyEntity(other.getId(), "company", "0000001001"));

        // when & then
        assertCodeException(() -> projectService.get(UserFactory.domain(other.getId(), Role.CAREER), project.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("get - 프로젝트가 존재하지 않을 때 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> projectService.get(UserFactory.domain(member.getId(), Role.CAREER), MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("list - 소유한 업체의 프로젝트 목록을 조회하고 업체가 없으면 빈 목록을 반환한다")
    void list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when
        val response = projectService.list(UserFactory.domain(member.getId(), Role.CAREER));
        val empty = projectService.list(UserFactory.domain(other.getId(), Role.CAREER));

        // then
        assertThat(response).extracting(Project::id).containsExactly(project.getId());
        assertThat(empty).isEmpty();
    }

    @Test
    @DisplayName("create - 소유한 업체가 있을 때 생성하면 프로젝트와 보드가 저장된다")
    void create_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val command = ProjectFactory.createCommand();

        // when
        val created = projectService.create(UserFactory.domain(member.getId(), Role.CAREER), command);

        // then
        val found = projectRepository.findById(created).orElseThrow();
        assertThat(found.getCompanyId()).isEqualTo(company.getId());
        assertThat(found.getTitle()).isEqualTo(command.title());
        assertThat(found.getAddress().getZipcode()).isEqualTo(command.address().getZipcode());
        val board = boardRepository.findByProjectId(created).orElseThrow();
        assertThat(board.getType()).isEqualTo(BoardType.PROJECT);
    }

    @Test
    @DisplayName("create - 소유한 업체가 없을 때 생성하면 NOT_FOUND로 실패한다")
    void create_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> projectService.create(UserFactory.domain(member.getId(), Role.CAREER), ProjectFactory.createCommand()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 프로젝트 한도를 초과할 때 생성하면 PROJECT_LIMIT_EXCEEDED로 실패한다")
    void create_fail_CO003() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        projectRepository.save(ProjectFactory.entity(company.getId()));

        // when & then
        assertCodeException(() -> projectService.create(UserFactory.domain(member.getId(), Role.CAREER), ProjectFactory.createCommand()))
                .hasExceptionCode(CompanyExceptionCode.PROJECT_LIMIT_EXCEEDED);
    }

    @Test
    @DisplayName("update - 소유한 업체의 프로젝트일 때 수정하면 제목과 주소가 갱신된다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val command = ProjectFactory.updateCommand();

        // when
        projectService.update(UserFactory.domain(member.getId(), Role.CAREER), project.getId(), command);

        // then
        val found = projectRepository.findById(project.getId()).orElseThrow();
        assertThat(found.getTitle()).isEqualTo(command.title());
        assertThat(found.getAddress().getZipcode()).isEqualTo(command.address().getZipcode());
    }

    @Test
    @DisplayName("update - 다른 업체의 프로젝트일 때 수정하면 FORBIDDEN으로 실패한다")
    void update_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(new CompanyEntity(other.getId(), "company", "0000001001"));

        // when & then
        assertCodeException(() -> projectService.update(UserFactory.domain(other.getId(), Role.CAREER), project.getId(), ProjectFactory.updateCommand()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("update - 프로젝트가 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> projectService.update(UserFactory.domain(member.getId(), Role.CAREER), MISSING_ID, ProjectFactory.updateCommand()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 소유한 업체의 프로젝트일 때 삭제하면 태스크·보드·노트가 함께 삭제된다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        val board = boardRepository.save(BoardFactory.entity(project.getId(), null));
        noteRepository.save(BoardFactory.noteEntity(board.getId(), member.getId()));

        // when
        projectService.delete(UserFactory.domain(member.getId(), Role.CAREER), project.getId());

        // then
        assertThat(projectRepository.findById(project.getId())).isEmpty();
        assertThat(taskRepository.findAllByProjectId(project.getId())).isEmpty();
        assertThat(boardRepository.findByProjectId(project.getId())).isEmpty();
        assertThat(noteRepository.findAllByBoardId(board.getId())).isEmpty();
    }

    @Test
    @DisplayName("delete - 다른 업체의 프로젝트일 때 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(new CompanyEntity(other.getId(), "company", "0000001001"));

        // when & then
        assertCodeException(() -> projectService.delete(UserFactory.domain(other.getId(), Role.CAREER), project.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("delete - 프로젝트가 존재하지 않을 때 삭제하면 NOT_FOUND로 실패한다")
    void delete_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> projectService.delete(UserFactory.domain(member.getId(), Role.CAREER), MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
