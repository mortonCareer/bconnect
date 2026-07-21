package to.bconnect.api.core.domain.offer;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.offer.OfferEntity;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.offer.OfferStatus;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OfferServiceTest {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @Mock private OfferRepository offerRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private MemberRepository memberRepository;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private ApiConfigProps apiConfigProps;

    @InjectMocks private OfferService service;

    @Test
    @DisplayName("만료 대상은 EXPIRED 로 전이하고 다음 Offer 를 ACTIVE 로 승격하며 due 를 오늘+3일로 갱신한다")
    void expire_expiresActiveAndPromotesNext() {
        var active = new OfferEntity(1L, 10L, 1);
        active.offered();
        var next = new OfferEntity(1L, 11L, 2);
        when(offerRepository.findById(100L)).thenReturn(Optional.of(active));
        when(offerRepository.existsByTaskIdAndStatus(1L, OfferStatus.ACTIVE)).thenReturn(false);
        when(offerRepository.findFirstByTaskIdAndStatusAndSeqGreaterThanOrderBySeqAsc(1L, OfferStatus.PENDING, 1))
                .thenReturn(Optional.of(next));
        when(apiConfigProps.zoneId()).thenReturn(KST);
        stubOwner(1L, 5L, 7L, 9L);

        service.expire(100L);

        assertThat(active.getStatus()).isEqualTo(OfferStatus.EXPIRED);
        assertThat(next.getStatus()).isEqualTo(OfferStatus.ACTIVE);
        assertThat(next.getDue()).isEqualTo(LocalDate.now(KST).plusDays(3));
    }

    @Test
    @DisplayName("ACTIVE 가 아닌 Offer 는 만료 처리하지 않는다")
    void expire_nonActive_noop() {
        var denied = new OfferEntity(1L, 10L, 1);
        denied.deny();
        when(offerRepository.findById(101L)).thenReturn(Optional.of(denied));

        service.expire(101L);

        assertThat(denied.getStatus()).isEqualTo(OfferStatus.DENIED);
    }

    private void stubOwner(Long taskId, Long projectId, Long companyId, Long ownerId) {
        var task = mock(TaskEntity.class);
        when(task.getProjectId()).thenReturn(projectId);
        var project = mock(ProjectEntity.class);
        when(project.getCompanyId()).thenReturn(companyId);
        var company = mock(CompanyEntity.class);
        when(company.getMemberId()).thenReturn(ownerId);
        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
    }
}
