package to.bconnect.api.core.domain.retention;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberEntity;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.retention.TransactionPartyEntity;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TransactionPartyFinder {

    private final OfferRepository offerRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<TransactionPartyEntity> findAll(MemberEntity member, Instant archivedAt, Instant expireAt) {
        val offers = offerRepository.findAllByWorkerIdAndAcceptedAtIsNotNull(member.getId());
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

        val transactionParties = new ArrayList<TransactionPartyEntity>();
        for (OfferEntity offer : offers) {
            val task = taskById.get(offer.getTaskId());
            if (task == null || task.getProjectId() == null)
                continue;

            val project = projectById.get(task.getProjectId());
            if (project == null)
                continue;

            val company = companyById.get(project.getCompanyId());
            if (company == null)
                continue;

            transactionParties.add(new TransactionPartyEntity(
                    member.getId(),
                    member.getName(),
                    member.getPhone(),
                    company.getId(),
                    company.getName(),
                    company.getBrn(),
                    offer.getAcceptedAt(),
                    archivedAt,
                    expireAt
            ));
        }
        return transactionParties;
    }
}
