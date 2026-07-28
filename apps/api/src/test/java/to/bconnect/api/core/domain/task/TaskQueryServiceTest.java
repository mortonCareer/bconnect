package to.bconnect.api.core.domain.task;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.*;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class TaskQueryServiceTest {

    private static final Long MISSING_ID = 999_999L;

    @Autowired private TaskQueryService taskQueryService;
    @Autowired private TaskRepository taskRepository;
    @Autowired private CoworkerRepository coworkerRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("get - 작업이 존재할 때 조회하면 작업을 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));

        // when
        val found = taskQueryService.get(task.getId());

        // then
        assertThat(found).isPresent();
        assertThat(found.orElseThrow().id()).isEqualTo(task.getId());
        assertThat(found.orElseThrow().workerId()).isEqualTo(member.getId());
    }

    @Test
    @DisplayName("listByIds - 작업 id 목록으로 조회하면 존재하는 작업만 반환한다")
    void listByIds_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val first = taskRepository.save(TaskFactory.entity(member.getId()));
        val second = taskRepository.save(TaskFactory.entity(member.getId()));

        // when
        val response = taskQueryService.listByIds(List.of(first.getId(), second.getId(), MISSING_ID));

        // then
        assertThat(response).extracting(Task::id)
                .containsExactlyInAnyOrder(first.getId(), second.getId());
    }

    @Test
    @DisplayName("list - 본인의 작업이 있을 때 목록을 조회하면 기술자 작업만 반환한다")
    void list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val workerTask = taskRepository.save(TaskFactory.entity(member.getId()));
        taskRepository.save(TaskFactory.projectEntity(project.getId(), member.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        taskRepository.save(TaskFactory.entity(other.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val response = taskQueryService.list(user);

        // then
        assertThat(response).extracting(Task::id).containsExactly(workerTask.getId());
    }

    @Test
    @DisplayName("listAssigned - 본인에게 할당된 작업이 있을 때 목록을 조회하면 프로젝트 작업만 반환한다")
    void listAssigned_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        taskRepository.save(TaskFactory.entity(member.getId()));
        val assigned = taskRepository.save(TaskFactory.projectEntity(project.getId(), member.getId()));
        taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val response = taskQueryService.listAssigned(user);

        // then
        assertThat(response).extracting(Task::id).containsExactly(assigned.getId());
    }

    @Test
    @DisplayName("listByCoworker - 동료일 때 목록을 조회하면 동료의 모든 작업을 반환한다")
    void listByCoworker_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val target = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        coworkerRepository.save(CoworkerFactory.entity(member.getId(), target.getId()));
        val company = companyRepository.save(CompanyFactory.entity(target.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val workerTask = taskRepository.save(TaskFactory.entity(target.getId()));
        val assigned = taskRepository.save(TaskFactory.projectEntity(project.getId(), target.getId()));
        taskRepository.save(TaskFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val response = taskQueryService.listByCoworker(user, target.getId());

        // then
        assertThat(response).extracting(Task::id)
                .containsExactlyInAnyOrder(workerTask.getId(), assigned.getId());
    }

    @Test
    @DisplayName("listByProject - 소유한 업체의 프로젝트일 때 목록을 조회하면 프로젝트의 작업을 반환한다")
    void listByProject_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val assigned = taskRepository.save(TaskFactory.projectEntity(project.getId(), member.getId()));
        val unassigned = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        taskRepository.save(TaskFactory.entity(member.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val response = taskQueryService.listByProject(user, project.getId());

        // then
        assertThat(response).extracting(Task::id)
                .containsExactlyInAnyOrder(assigned.getId(), unassigned.getId());
    }

    @Test
    @DisplayName("listAssigneeIdsByProject - 소유한 업체의 프로젝트일 때 조회하면 중복 없는 할당 기술자 id를 반환한다")
    void listAssigneeIdsByProject_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(member.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val worker = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        taskRepository.save(TaskFactory.projectEntity(project.getId(), worker.getId()));
        taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        val response = taskQueryService.listAssigneeIdsByProject(user, project.getId());

        // then
        assertThat(response).containsExactly(worker.getId());
    }

    @Test
    @DisplayName("listByCoworker - 동료가 아닐 때 목록을 조회하면 FORBIDDEN으로 실패한다")
    void listByCoworker_fail_C004() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val target = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> taskQueryService.listByCoworker(user, target.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("listByProject - 다른 업체의 프로젝트일 때 목록을 조회하면 FORBIDDEN으로 실패한다")
    void listByProject_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val ownerCompany = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(ownerCompany.getId()));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        companyRepository.save(CompanyFactory.entity(other.getId(), "0000001001"));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> taskQueryService.listByProject(user, project.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }
}
