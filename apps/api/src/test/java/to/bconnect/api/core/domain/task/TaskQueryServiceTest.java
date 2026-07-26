package to.bconnect.api.core.domain.task;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskQueryServiceTest {

    private static final AuthUser USER = new AuthUser(1L, "1", Set.of(Role.CAREER));
    private static final Long PROJECT_ID = 100L;

    @Mock private TaskRepository taskRepository;
    @Mock private CoworkerRepository coworkerRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ProjectRepository projectRepository;

    @InjectMocks private TaskQueryService service;

    @Test
    @DisplayName("업체가 없으면 할당 기술자 조회는 NOT_FOUND")
    void listAssigneeIdsByProject_noCompany_throwsNotFound() {
        when(companyRepository.findByMemberId(USER.id())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.listAssigneeIdsByProject(USER, PROJECT_ID))
                .isInstanceOf(CodeException.class)
                .extracting("exceptionCode")
                .isEqualTo(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("다른 업체의 프로젝트면 할당 기술자 조회는 FORBIDDEN")
    void listAssigneeIdsByProject_otherCompany_throwsForbidden() {
        givenCompany(10L);
        givenProject(20L);

        assertThatThrownBy(() -> service.listAssigneeIdsByProject(USER, PROJECT_ID))
                .isInstanceOf(CodeException.class)
                .extracting("exceptionCode")
                .isEqualTo(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("할당 기술자는 중복 없이 반환된다")
    void listAssigneeIdsByProject_returnsDistinctWorkerIds() {
        givenCompany(10L);
        givenProject(10L);
        var tasks = List.of(task(200L), task(201L), task(200L));
        when(taskRepository.findAllByProjectIdAndWorkerIdNotNull(PROJECT_ID)).thenReturn(tasks);

        var assigneeIds = service.listAssigneeIdsByProject(USER, PROJECT_ID);

        assertThat(assigneeIds).containsExactly(200L, 201L);
    }

    @Test
    @DisplayName("할당된 기술자가 없으면 빈 목록을 반환한다")
    void listAssigneeIdsByProject_noAssignee_returnsEmpty() {
        givenCompany(10L);
        givenProject(10L);
        when(taskRepository.findAllByProjectIdAndWorkerIdNotNull(PROJECT_ID)).thenReturn(List.of());

        var assigneeIds = service.listAssigneeIdsByProject(USER, PROJECT_ID);

        assertThat(assigneeIds).isEmpty();
    }

    private void givenCompany(Long companyId) {
        var company = mock(CompanyEntity.class);
        when(company.getId()).thenReturn(companyId);
        when(companyRepository.findByMemberId(USER.id())).thenReturn(Optional.of(company));
    }

    private void givenProject(Long companyId) {
        var project = mock(ProjectEntity.class);
        when(project.getCompanyId()).thenReturn(companyId);
        when(projectRepository.findById(PROJECT_ID)).thenReturn(Optional.of(project));
    }

    private static TaskEntity task(Long workerId) {
        var task = mock(TaskEntity.class);
        when(task.getWorkerId()).thenReturn(workerId);
        return task;
    }
}
