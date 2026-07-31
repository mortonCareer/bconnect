package to.bconnect.api.core.domain.company;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentFinder;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.board.BoardRepository;
import to.bconnect.api.storage.board.NoteRepository;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;

import java.util.Collection;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final MemberRepository memberRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final NoteRepository noteRepository;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentLinker attachmentLinker;

    @Transactional(readOnly = true)
    public CursorPage<Company> list(CursorLimit cursor) {
        val companies = companyRepository.findAllBy(
                cursor.toScrollPosition(),
                cursor.toLimit(),
                cursor.toSort()
        );

        return CursorPage.from(
                companies.map(Company::of),
                Company::id
        );
    }

    @Transactional(readOnly = true)
    public Company getOrWithdrawn(Long companyId) {
        return companyRepository.findById(companyId)
                .map(Company::of)
                .orElse(Company.withdrawn(companyId));
    }

    @Transactional(readOnly = true)
    public Map<Long, Company> resolveMapOrWithdrawn(Collection<Long> companyIds) {
        val companyMap = companyRepository.findAllByIdIn(companyIds).stream()
                .map(Company::of)
                .collect(Collectors.toMap(Company::id, Function.identity()));
        return companyIds.stream()
                .distinct()
                .collect(Collectors.toMap(Function.identity(),
                        it -> companyMap.getOrDefault(it, Company.withdrawn(it))));
    }

    @Transactional(readOnly = true)
    public Company get(Long companyId) {
        val found = companyRepository.findById(companyId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        return Company.of(found);
    }

    @Transactional(readOnly = true)
    public Company get(AuthUser user) {
        val found = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        return Company.of(found);
    }

    @Transactional
    public Long create(AuthUser user, CreateCompany command) {
        if (companyRepository.existsByMemberId(user.id()))
            throw new CodeException(CompanyExceptionCode.ALREADY_EXISTS);

        if (companyRepository.existsByBrn(command.brn()))
            throw new CodeException(CompanyExceptionCode.DUPLICATE_BRN);

        val created = new CompanyEntity(
                user.id(),
                command.name(),
                command.brn()
        );

        val member = memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val companyId = companyRepository.save(created).getId();
        if (command.pictureId() != null) {
            attachmentFinder.validateOwnership(user.id(), command.pictureId());
            attachmentLinker.link(AttachmentReferenceType.COMPANY, companyId, command.pictureId());
        }

        member.grantRole(Role.PLAN);
        return companyId;
    }

    @Transactional
    public void update(AuthUser user, Long pictureId) {
        val found = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (pictureId == null) {
            attachmentLinker.unlink(AttachmentReferenceType.COMPANY, found.getId());
            return;
        }

        attachmentFinder.validateOwnership(user.id(), pictureId);
        attachmentLinker.unlink(AttachmentReferenceType.COMPANY, found.getId());
        attachmentLinker.link(AttachmentReferenceType.COMPANY, found.getId(), pictureId);
    }

    @Transactional
    public void delete(AuthUser user) {
        val found = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val projects = projectRepository.findAllByCompanyId(found.getId());
        projects.forEach(it -> {
            taskRepository.deleteAllByProjectId(it.getId());
            boardRepository.findByProjectId(it.getId()).ifPresent(board -> {
                noteRepository.deleteAllByBoardId(board.getId());
                boardRepository.delete(board);
            });
        });
        projectRepository.deleteAll(projects);

        attachmentLinker.unlink(AttachmentReferenceType.COMPANY, found.getId());
        companyRepository.delete(found);

        memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND))
                .revokeRole(Role.PLAN);
    }
}
