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
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.board.BoardEntity;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.BoardType;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final int MAX_PROJECT_COUNT = 1;
    // TODO 삭제 예정
    private static final String DEFAULT_TITLE = "새 프로젝트";
    private static final Address DEFAULT_ADDRESS = new Address(
            "16419", "경기도", "수원시 장안구", "서부로 2066", "성균관대학교",
            new BigDecimal("37.294"), new BigDecimal("126.974")
    );

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final NoteRepository noteRepository;

    @Transactional(readOnly = true)
    public List<Project> list(AuthUser user) {
        val company = findCompany(user);

        return projectRepository.findAllByCompanyId(company.getId())
                .stream()
                .map(Project::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Project get(Long projectId) {
        val found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        return Project.of(found);
    }

    @Transactional(readOnly = true)
    public Map<Long, Address> resolveAddressMap(Collection<Long> projectIds) {
        return projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(ProjectEntity::getId, ProjectEntity::getAddress));
    }

    @Transactional
    public Long create(AuthUser user, CreateProject command) {
        val company = findCompany(user);

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
    public void createDefault(Long companyId) {
        val created = projectRepository.save(new ProjectEntity(
                companyId,
                DEFAULT_TITLE,
                DEFAULT_ADDRESS
        ));
        boardRepository.save(new BoardEntity(BoardType.PROJECT, created.getId(), null));
    }

    @Transactional
    public void update(AuthUser user, Long projectId, UpdateProject command) {
        val found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val company = findCompany(user);
        if (!found.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(command.title(), command.address());
    }

    @Transactional
    public void delete(AuthUser user, Long projectId) {
        val optional = projectRepository.findById(projectId);
        if (optional.isEmpty())
            return;
        val found = optional.get();

        val company = findCompany(user);
        if (!found.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        taskRepository.deleteAllByProjectId(found.getId());
        boardRepository.findByProjectId(found.getId()).ifPresent(board -> {
            noteRepository.deleteAllByBoardId(board.getId());
            boardRepository.delete(board);
        });
        projectRepository.delete(found);
    }

    private CompanyEntity findCompany(AuthUser user) {
        return companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }
}
