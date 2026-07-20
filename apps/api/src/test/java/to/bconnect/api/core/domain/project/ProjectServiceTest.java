package to.bconnect.api.core.domain.project;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.company.CompanyExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    private static final AuthUser USER = new AuthUser(1L, "1", "USER");

    @Mock private ProjectRepository projectRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private BoardRepository boardRepository;
    @Mock private NoteRepository noteRepository;

    @InjectMocks private ProjectService service;

    @Test
    @DisplayName("업체 프로젝트 수가 한도에 도달하면 생성은 PROJECT_LIMIT_EXCEEDED")
    void create_atLimit_throwsLimitExceeded() {
        var company = mock(CompanyEntity.class);
        when(company.getId()).thenReturn(10L);
        when(companyRepository.findByMemberId(USER.id())).thenReturn(Optional.of(company));
        when(projectRepository.countByCompanyId(10L)).thenReturn(1L);

        assertThatThrownBy(() -> service.create(USER, createProject()))
                .isInstanceOf(CodeException.class)
                .extracting("exceptionCode")
                .isEqualTo(CompanyExceptionCode.PROJECT_LIMIT_EXCEEDED);
    }

    @Test
    @DisplayName("한도 미만이면 프로젝트를 저장하고 id 를 반환한다")
    void create_underLimit_savesProject() {
        var company = mock(CompanyEntity.class);
        when(company.getId()).thenReturn(10L);
        when(companyRepository.findByMemberId(USER.id())).thenReturn(Optional.of(company));
        when(projectRepository.countByCompanyId(10L)).thenReturn(0L);
        var created = mock(ProjectEntity.class);
        when(created.getId()).thenReturn(100L);
        when(projectRepository.save(any())).thenReturn(created);

        var id = service.create(USER, createProject());

        assertThat(id).isEqualTo(100L);
    }

    private static CreateProject createProject() {
        return new CreateProject("제목", null);
    }
}
