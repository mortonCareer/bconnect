package to.bconnect.api.core.domain.retention;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.retention.RetentionPolicy;
import to.bconnect.api.storage.retention.TransactionPartyEntity;
import to.bconnect.api.storage.retention.TransactionPartyRepository;
import to.bconnect.api.storage.retention.TransactionPartyType;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;

import java.time.Instant;
import java.time.Period;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TransactionPartyService {

    private final OfferRepository offerRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final MemberRepository memberRepository;
    private final TransactionPartyRepository transactionPartyRepository;
    private final ApiConfigProps apiConfigProps;

    @Transactional
    public void capture(OfferEntity offer) {
        captureAll(List.of(offer));
    }

    @Transactional
    public void captureProject(ProjectEntity project) {
        val taskIds = taskRepository.findAllByProjectIdOrderByIdAsc(project.getId()).stream()
                .map(TaskEntity::getId)
                .toList();
        if (taskIds.isEmpty())
            return;

        captureAll(offerRepository.findAllByTaskIdInAndAcceptedAtIsNotNull(taskIds));
    }

    @Transactional
    public void captureWorker(MemberEntity member) {
        captureAll(offerRepository.findAllByWorkerIdAndAcceptedAtIsNotNull(member.getId()));
    }

    @Transactional
    public void withdraw(MemberEntity member, Instant withdrawnAt) {
        captureWorker(member);
        val retention = TransactionPartyEntity.class.getAnnotation(RetentionPolicy.class);
        val expireAt = withdrawnAt.atZone(apiConfigProps.zoneId())
                .plus(Period.parse(retention.value()))
                .toInstant();
        transactionPartyRepository.findAllByMemberIdAndWithdrawnAtIsNull(member.getId())
                .forEach(it -> it.withdraw(withdrawnAt, expireAt));
    }

    private void captureAll(Collection<OfferEntity> offers) {
        if (offers.isEmpty())
            return;

        val taskById = taskRepository.findAllById(
                        offers.stream().map(OfferEntity::getTaskId).distinct().toList()
                ).stream()
                .collect(Collectors.toMap(TaskEntity::getId, Function.identity()));
        val projectById = projectRepository.findAllById(
                        taskById.values().stream()
                                .map(TaskEntity::getProjectId)
                                .filter(Objects::nonNull)
                                .distinct()
                                .toList()
                ).stream()
                .collect(Collectors.toMap(ProjectEntity::getId, Function.identity()));
        val companyById = companyRepository.findAllById(
                        projectById.values().stream().map(ProjectEntity::getCompanyId).distinct().toList()
                ).stream()
                .collect(Collectors.toMap(CompanyEntity::getId, Function.identity()));
        val memberIds = Stream.concat(
                        offers.stream().map(OfferEntity::getWorkerId),
                        companyById.values().stream().map(CompanyEntity::getMemberId)
                ).distinct()
                .toList();
        val memberById = memberRepository.findAllById(memberIds).stream()
                .collect(Collectors.toMap(MemberEntity::getId, Function.identity()));
        val existing = transactionPartyRepository.findAllByOfferIdIn(
                        offers.stream().map(OfferEntity::getId).toList()
                ).stream()
                .map(it -> new TransactionPartyKey(it.getOfferId(), it.getMemberId()))
                .collect(Collectors.toSet());
        val created = new ArrayList<TransactionPartyEntity>();

        for (val offer : offers) {
            val task = taskById.get(offer.getTaskId());
            if (task == null || task.getProjectId() == null)
                continue;
            val project = projectById.get(task.getProjectId());
            if (project == null)
                continue;
            val company = companyById.get(project.getCompanyId());
            val worker = memberById.get(offer.getWorkerId());
            val owner = company == null ? null : memberById.get(company.getMemberId());
            if (company == null || worker == null || owner == null)
                continue;

            if (existing.add(new TransactionPartyKey(offer.getId(), worker.getId())))
                created.add(new TransactionPartyEntity(
                        offer.getId(), worker.getId(), worker.getName(), worker.getPhone(),
                        company.getId(), company.getName(), owner.getPhone(), company.getBrn(),
                        TransactionPartyType.COMPANY, offer.getAcceptedAt()
                ));
            if (existing.add(new TransactionPartyKey(offer.getId(), owner.getId())))
                created.add(new TransactionPartyEntity(
                        offer.getId(), owner.getId(), owner.getName(), owner.getPhone(),
                        worker.getId(), worker.getName(), worker.getPhone(), null,
                        TransactionPartyType.MEMBER, offer.getAcceptedAt()
                ));
        }
        transactionPartyRepository.saveAll(created);
    }

    private record TransactionPartyKey(Long offerId, Long memberId) {
    }
}
