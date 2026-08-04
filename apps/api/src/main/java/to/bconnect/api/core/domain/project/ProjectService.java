package to.bconnect.api.core.domain.project;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.company.CompanyExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.board.BoardEntity;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.BoardType;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final int MAX_PROJECT_COUNT = 1;

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final NoteRepository noteRepository;

    @Transactional(readOnly = true)
    public Project get(AuthUser user, Long projectId) {
        val found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val company = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!found.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return Project.of(found);
    }

    @Transactional(readOnly = true)
    public List<Project> list(AuthUser user) {
        val optional = companyRepository.findByMemberId(user.id());
        if (optional.isEmpty())
            return List.of();

        return projectRepository.findAllByCompanyIdOrderByIdAsc(optional.get().getId())
                .stream()
                .map(Project::of)
                .toList();
    }

    @Transactional
    public Long create(AuthUser user, CreateProject command) {
        val company = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (projectRepository.countByCompanyId(company.getId()) >= MAX_PROJECT_COUNT)
            throw new CodeException(CompanyExceptionCode.PROJECT_LIMIT_EXCEEDED);

        val created = projectRepository.save(new ProjectEntity(
                company.getId(),
                command.title(),
                command.address()
        ));
        boardRepository.save(new BoardEntity(BoardType.PROJECT, created.getId(), null));

        return created.getId();
    }

    @Transactional
    public void update(AuthUser user, Long projectId, UpdateProject command) {
        val found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val company = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!found.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(command.title(), command.address());
    }

    @Transactional
    public void delete(AuthUser user, Long projectId) {
        val found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val company = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!found.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        taskRepository.deleteAllByProjectId(found.getId());
        boardRepository.findByProjectId(found.getId()).ifPresent(board -> {
            noteRepository.deleteAllByBoardId(board.getId());
            boardRepository.delete(board);
        });
        projectRepository.delete(found);
    }
}
