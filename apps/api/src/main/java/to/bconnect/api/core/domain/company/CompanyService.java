package to.bconnect.api.core.domain.company;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentFinder;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.attachment.domain.cleanup.AttachmentCleanupService;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.TaskExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.company.CompanyStatus;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskProgress;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskStatus;

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
    private final ProjectService projectService;
    private final TaskRepository taskRepository;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentLinker attachmentLinker;
    private final AttachmentCleanupService attachmentCleanupService;
    private final ApplicationEventPublisher eventPublisher;

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

        memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        attachmentFinder.validateOwnership(user.id(), command.attachmentId());

        val created = new CompanyEntity(
                user.id(),
                command.name(),
                command.brn()
        );

        val companyId = companyRepository.save(created).getId();
        attachmentLinker.link(AttachmentReferenceType.COMPANY_CERTIFICATE, companyId, command.attachmentId());
        if (command.pictureId() != null) {
            attachmentFinder.validateOwnership(user.id(), command.pictureId());
            attachmentLinker.link(AttachmentReferenceType.COMPANY, companyId, command.pictureId());
        }

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
    public void accept(Long id) {
        val found = companyRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getStatus() != CompanyStatus.PENDING)
            throw new CodeException(CompanyExceptionCode.INVALID_STATUS);

        found.accept();

        memberRepository.findById(found.getMemberId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND))
                .grantRole(Role.PLAN);

        attachmentLinker.unlink(AttachmentReferenceType.COMPANY_CERTIFICATE, found.getId());

        eventPublisher.publishEvent(
                new CompanyReviewedEvent(found.getId(), found.getMemberId(), CompanyStatus.ACCEPTED));
    }

    @Transactional
    public void deny(Long id) {
        val found = companyRepository.findById(id)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getStatus() != CompanyStatus.PENDING)
            throw new CodeException(CompanyExceptionCode.INVALID_STATUS);

        found.deny();

        attachmentLinker.unlink(AttachmentReferenceType.COMPANY_CERTIFICATE, found.getId());

        eventPublisher.publishEvent(
                new CompanyReviewedEvent(found.getId(), found.getMemberId(), CompanyStatus.DENIED));
    }

    @Transactional
    public void delete(AuthUser user) {
        val found = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val projects = projectRepository.findAllByCompanyId(found.getId());
        val projectIds = projects.stream().map(ProjectEntity::getId).toList();
        if (!projectIds.isEmpty()) {
            if (taskRepository.existsByProjectIdInAndProgress(projectIds, TaskProgress.IN_PROGRESS))
                throw new CodeException(CompanyExceptionCode.DELETE_TASK_EXISTS);

            if (taskRepository.existsByProjectIdInAndStatusIn(projectIds, TaskStatus.ENGAGED))
                throw new CodeException(TaskExceptionCode.OFFERED_EXISTS);
        }

        projects.forEach(projectService::projectTeardown);

        attachmentCleanupService.purge(AttachmentReferenceType.COMPANY, found.getId());
        attachmentCleanupService.purge(AttachmentReferenceType.COMPANY_CERTIFICATE, found.getId());
        companyRepository.delete(found);

        memberRepository.findById(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND))
                .revokeRole(Role.PLAN);
    }
}
