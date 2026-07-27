package to.bconnect.api.core.domain.task;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskStatus;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.CompanyFactory;
import to.bconnect.api.support.fixture.MemberFactory;
import to.bconnect.api.support.fixture.OfferFactory;
import to.bconnect.api.support.fixture.PostFactory;
import to.bconnect.api.support.fixture.ProjectFactory;
import to.bconnect.api.support.fixture.TaskFactory;
import to.bconnect.api.support.fixture.UserFactory;

import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class TaskServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private TaskService taskService;
    @Autowired private TaskRepository taskRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private OfferRepository offerRepository;
    @Autowired private PostRepository postRepository;

    @Test
    @DisplayName("createByWorker - 회원이 존재할 때 생성하면 기술자 작업이 저장된다")
    void createByWorker_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val command = TaskFactory.createCommand();

        // when
        val created = taskService.createByWorker(UserFactory.domain(member.getId(), Role.CAREER), command);

        // then
        val found = taskRepository.findById(created).orElseThrow();
        assertThat(found.getType()).isEqualTo(TaskType.WORKER);
        assertThat(found.getStatus()).isEqualTo(TaskStatus.DRAFT);
        assertThat(found.getWorkerId()).isEqualTo(member.getId());
        assertThat(found.getWorkerTitle()).isEqualTo(command.title());
        assertThat(found.getWorkerMemo()).isEqualTo(command.memo());
        assertThat(found.getWorkerCompany()).isEqualTo(command.company());
        assertThat(found.getTrades()).isEqualTo(command.trades());
        assertThat(found.getProjectId()).isNull();
    }

    @Test
    @DisplayName("createByCompany - 소유한 업체의 프로젝트일 때 생성하면 프로젝트 작업이 저장된다")
    void createByCompany_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val command = TaskFactory.createProjectCommand(project.getId());

        // when
        val created = taskService.createByCompany(UserFactory.domain(member.getId(), Role.CAREER), command);

        // then
        val found = taskRepository.findById(created).orElseThrow();
        assertThat(found.getType()).isEqualTo(TaskType.PROJECT);
        assertThat(found.getStatus()).isEqualTo(TaskStatus.DRAFT);
        assertThat(found.getProjectId()).isEqualTo(project.getId());
        assertThat(found.getProjectTitle()).isEqualTo(command.title());
        assertThat(found.getProjectRequirement()).isEqualTo(command.requirement());
        assertThat(found.getProjectMemo()).isEqualTo(command.memo());
        assertThat(found.getWorkerId()).isNull();
    }

    @Test
    @DisplayName("createByCompany - 다른 업체의 프로젝트일 때 생성하면 FORBIDDEN으로 실패한다")
    void createByCompany_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(new CompanyEntity(other.getId(), "company", "0000001001"));

        // when & then
        assertCodeException(() -> taskService.createByCompany(UserFactory.domain(other.getId(), Role.CAREER),
                TaskFactory.createProjectCommand(project.getId())))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("createByCompany - 프로젝트가 존재하지 않을 때 생성하면 NOT_FOUND로 실패한다")
    void createByCompany_fail_C005_project() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> taskService.createByCompany(UserFactory.domain(member.getId(), Role.CAREER),
                TaskFactory.createProjectCommand(MISSING_ID)))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("createByCompany - 소유한 업체가 없을 때 생성하면 NOT_FOUND로 실패한다")
    void createByCompany_fail_C005_company() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when & then
        assertCodeException(() -> taskService.createByCompany(UserFactory.domain(other.getId(), Role.CAREER),
                TaskFactory.createProjectCommand(project.getId())))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("updateByWorker - 본인의 기술자 작업일 때 수정하면 제목과 공종이 갱신된다")
    void updateByWorker_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));
        val command = TaskFactory.updateCommand();

        // when
        taskService.updateByWorker(UserFactory.domain(member.getId(), Role.CAREER), task.getId(), command);

        // then
        val found = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(found.getWorkerTitle()).isEqualTo(command.title());
        assertThat(found.getWorkerMemo()).isEqualTo(command.memo());
        assertThat(found.getTrades()).isEqualTo(command.trades());
    }

    @Test
    @DisplayName("updateByWorker - 프로젝트 작업일 때 수정하면 INVALID_TYPE으로 실패한다")
    void updateByWorker_fail_T002() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                member.getId(), null, null, null, null,
                project.getId(), "task", "requirement", "memo"));

        // when & then
        assertCodeException(() -> taskService.updateByWorker(UserFactory.domain(member.getId(), Role.CAREER),
                task.getId(), TaskFactory.updateCommand()))
                .hasExceptionCode(TaskExceptionCode.INVALID_TYPE);
    }

    @Test
    @DisplayName("updateByWorker - 다른 기술자의 작업일 때 수정하면 FORBIDDEN으로 실패한다")
    void updateByWorker_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(owner.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when & then
        assertCodeException(() -> taskService.updateByWorker(UserFactory.domain(other.getId(), Role.CAREER),
                task.getId(), TaskFactory.updateCommand()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("updateByWorker - 작업이 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void updateByWorker_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> taskService.updateByWorker(UserFactory.domain(member.getId(), Role.CAREER),
                MISSING_ID, TaskFactory.updateCommand()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("updateByCompany - 소유한 업체의 프로젝트 작업일 때 수정하면 제목과 요구사항이 갱신된다")
    void updateByCompany_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        val command = TaskFactory.updateProjectCommand();

        // when
        taskService.updateByCompany(UserFactory.domain(member.getId(), Role.CAREER), task.getId(), command);

        // then
        val found = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(found.getProjectTitle()).isEqualTo(command.title());
        assertThat(found.getProjectRequirement()).isEqualTo(command.requirement());
        assertThat(found.getProjectMemo()).isEqualTo(command.memo());
        assertThat(found.getTrades()).isEqualTo(command.trades());
    }

    @Test
    @DisplayName("updateByCompany - 기술자 작업일 때 수정하면 INVALID_TYPE으로 실패한다")
    void updateByCompany_fail_T002() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> taskService.updateByCompany(UserFactory.domain(member.getId(), Role.CAREER),
                task.getId(), TaskFactory.updateProjectCommand()))
                .hasExceptionCode(TaskExceptionCode.INVALID_TYPE);
    }

    @Test
    @DisplayName("updateByCompany - 다른 업체의 프로젝트 작업일 때 수정하면 FORBIDDEN으로 실패한다")
    void updateByCompany_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(new CompanyEntity(other.getId(), "company", "0000001001"));

        // when & then
        assertCodeException(() -> taskService.updateByCompany(UserFactory.domain(other.getId(), Role.CAREER),
                task.getId(), TaskFactory.updateProjectCommand()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("updateByCompany - 작업이 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void updateByCompany_fail_C005_task() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> taskService.updateByCompany(UserFactory.domain(member.getId(), Role.CAREER),
                MISSING_ID, TaskFactory.updateProjectCommand()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("updateByCompany - 프로젝트가 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void updateByCompany_fail_C005_project() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        projectRepository.delete(project);

        // when & then
        assertCodeException(() -> taskService.updateByCompany(UserFactory.domain(member.getId(), Role.CAREER),
                task.getId(), TaskFactory.updateProjectCommand()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("updateByCompany - 소유한 업체가 없을 때 수정하면 NOT_FOUND로 실패한다")
    void updateByCompany_fail_C005_company() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when & then
        assertCodeException(() -> taskService.updateByCompany(UserFactory.domain(other.getId(), Role.CAREER),
                task.getId(), TaskFactory.updateProjectCommand()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("updateByAssignee - 본인에게 할당된 프로젝트 작업일 때 수정하면 기술자 제목과 메모가 갱신된다")
    void updateByAssignee_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                member.getId(), null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        val command = TaskFactory.updateAssigneeCommand();

        // when
        taskService.updateByAssignee(UserFactory.domain(member.getId(), Role.CAREER), task.getId(), command);

        // then
        val found = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(found.getWorkerTitle()).isEqualTo(command.title());
        assertThat(found.getWorkerMemo()).isEqualTo(command.memo());
        assertThat(found.getProjectTitle()).isEqualTo("task");
    }

    @Test
    @DisplayName("updateByAssignee - 다른 기술자에게 할당된 작업일 때 수정하면 FORBIDDEN으로 실패한다")
    void updateByAssignee_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                owner.getId(), null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when & then
        assertCodeException(() -> taskService.updateByAssignee(UserFactory.domain(other.getId(), Role.CAREER),
                task.getId(), TaskFactory.updateAssigneeCommand()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("updateByAssignee - 작업이 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void updateByAssignee_fail_C005() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        // when & then
        assertCodeException(() -> taskService.updateByAssignee(UserFactory.domain(member.getId(), Role.CAREER),
                MISSING_ID, TaskFactory.updateAssigneeCommand()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("updateByAssignee - 기술자 작업일 때 수정하면 INVALID_TYPE으로 실패한다")
    void updateByAssignee_fail_T002() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));

        // when & then
        assertCodeException(() -> taskService.updateByAssignee(UserFactory.domain(member.getId(), Role.CAREER),
                task.getId(), TaskFactory.updateAssigneeCommand()))
                .hasExceptionCode(TaskExceptionCode.INVALID_TYPE);
    }

    @Test
    @DisplayName("updateByAssignee - 할당된 기술자가 없는 프로젝트 작업일 때 수정하면 NOT_ASSIGNED로 실패한다")
    void updateByAssignee_fail_T001() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));

        // when & then
        assertCodeException(() -> taskService.updateByAssignee(UserFactory.domain(member.getId(), Role.CAREER),
                task.getId(), TaskFactory.updateAssigneeCommand()))
                .hasExceptionCode(TaskExceptionCode.NOT_ASSIGNED);
    }

    @Test
    @DisplayName("delete - 권한이 있는 작업일 때 삭제하면 제안이 삭제되고 게시글의 작업 연결이 해제되며 없는 작업은 무시된다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val workerTask = taskRepository.save(TaskFactory.entity(member.getId()));
        val projectTask = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        val offer = offerRepository.save(OfferFactory.entity(workerTask.getId(), member.getId()));
        val post = postRepository.save(PostFactory.entity(member.getId(), workerTask.getId()));

        // when
        taskService.delete(UserFactory.domain(member.getId(), Role.CAREER), workerTask.getId());
        taskService.delete(UserFactory.domain(member.getId(), Role.CAREER), projectTask.getId());
        taskService.delete(UserFactory.domain(member.getId(), Role.CAREER), MISSING_ID);

        // then
        assertThat(taskRepository.findById(workerTask.getId())).isEmpty();
        assertThat(taskRepository.findById(projectTask.getId())).isEmpty();
        assertThat(offerRepository.findById(offer.getId())).isEmpty();
        assertThat(postRepository.findById(post.getId()).orElseThrow().getTaskId()).isNull();
    }

    @Test
    @DisplayName("delete - 다른 기술자의 작업일 때 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004_worker() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(owner.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when & then
        assertCodeException(() -> taskService.delete(UserFactory.domain(other.getId(), Role.CAREER), task.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("delete - 다른 업체의 프로젝트 작업일 때 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004_company() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(new CompanyEntity(other.getId(), "company", "0000001001"));

        // when & then
        assertCodeException(() -> taskService.delete(UserFactory.domain(other.getId(), Role.CAREER), task.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("delete - 프로젝트가 존재하지 않을 때 삭제하면 NOT_FOUND로 실패한다")
    void delete_fail_C005_project() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        projectRepository.delete(project);

        // when & then
        assertCodeException(() -> taskService.delete(UserFactory.domain(member.getId(), Role.CAREER), task.getId()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 소유한 업체가 없을 때 프로젝트 작업을 삭제하면 NOT_FOUND로 실패한다")
    void delete_fail_C005_company() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(new TaskEntity(TaskType.PROJECT, Set.of(Trade.ELECTRICAL),
                LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30),
                null, null, null, null, null,
                project.getId(), "task", "requirement", "memo"));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));

        // when & then
        assertCodeException(() -> taskService.delete(UserFactory.domain(other.getId(), Role.CAREER), task.getId()))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }
}
