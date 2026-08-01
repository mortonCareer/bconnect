package to.bconnect.api.core.domain.offer;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.offer.OfferStatus;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskStatus;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.*;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class OfferServiceTest {

    @Autowired private OfferService offerService;
    @Autowired private OfferRepository offerRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private ProjectRepository projectRepository;
    @Autowired private CompanyRepository companyRepository;
    @Autowired private MemberRepository memberRepository;

    @Test
    @DisplayName("create - 첫 섭외 요청을 생성하면 작업이 OFFERED가 된다")
    void create_offered() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("owner", "01000001001", Role.PLAN));
        val worker = memberRepository.save(MemberFactory.entity("worker", "01000001002", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val ownerUser = UserFactory.domain(owner.getId(), Role.PLAN);

        // when
        val created = offerService.create(ownerUser, OfferFactory.command(task.getId(), worker.getId()));

        // then
        assertThat(offerRepository.findById(created).orElseThrow().getStatus()).isEqualTo(OfferStatus.ACTIVE);
        assertThat(taskRepository.findById(task.getId()).orElseThrow().getStatus()).isEqualTo(TaskStatus.OFFERED);
    }

    @Test
    @DisplayName("deny - 대기 중인 후보가 남아 있으면 다음 후보가 승격되고 작업은 OFFERED를 유지한다")
    void deny_promoteNext() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("owner", "01000001001", Role.PLAN));
        val worker = memberRepository.save(MemberFactory.entity("worker", "01000001002", Role.CAREER));
        val next = memberRepository.save(MemberFactory.entity("next", "01000001003", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val ownerUser = UserFactory.domain(owner.getId(), Role.PLAN);
        val first = offerService.create(ownerUser, OfferFactory.command(task.getId(), worker.getId()));
        val second = offerService.create(ownerUser, OfferFactory.command(task.getId(), next.getId()));

        // when
        offerService.deny(UserFactory.domain(worker.getId(), Role.CAREER), first);

        // then
        assertThat(offerRepository.findById(second).orElseThrow().getStatus()).isEqualTo(OfferStatus.ACTIVE);
        assertThat(taskRepository.findById(task.getId()).orElseThrow().getStatus()).isEqualTo(TaskStatus.OFFERED);
    }

    @Test
    @DisplayName("deny - 마지막 후보가 거절하면 작업이 NONE으로 돌아간다")
    void deny_none() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("owner", "01000001001", Role.PLAN));
        val worker = memberRepository.save(MemberFactory.entity("worker", "01000001002", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val ownerUser = UserFactory.domain(owner.getId(), Role.PLAN);
        val created = offerService.create(ownerUser, OfferFactory.command(task.getId(), worker.getId()));

        // when
        offerService.deny(UserFactory.domain(worker.getId(), Role.CAREER), created);

        // then
        assertThat(offerRepository.findById(created).orElseThrow().getStatus()).isEqualTo(OfferStatus.DENIED);
        assertThat(taskRepository.findById(task.getId()).orElseThrow().getStatus()).isEqualTo(TaskStatus.NONE);
    }

    @Test
    @DisplayName("cancel - 마지막 후보를 취소하면 작업이 NONE으로 돌아간다")
    void cancel_none() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("owner", "01000001001", Role.PLAN));
        val worker = memberRepository.save(MemberFactory.entity("worker", "01000001002", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val ownerUser = UserFactory.domain(owner.getId(), Role.PLAN);
        val created = offerService.create(ownerUser, OfferFactory.command(task.getId(), worker.getId()));

        // when
        offerService.cancel(ownerUser, created);

        // then
        assertThat(offerRepository.findById(created).orElseThrow().getStatus()).isEqualTo(OfferStatus.CANCELED);
        assertThat(taskRepository.findById(task.getId()).orElseThrow().getStatus()).isEqualTo(TaskStatus.NONE);
    }

    @Test
    @DisplayName("expire - 마지막 후보가 만료되면 작업이 NONE으로 돌아간다")
    void expire_none() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("owner", "01000001001", Role.PLAN));
        val worker = memberRepository.save(MemberFactory.entity("worker", "01000001002", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val ownerUser = UserFactory.domain(owner.getId(), Role.PLAN);
        val created = offerService.create(ownerUser, OfferFactory.command(task.getId(), worker.getId()));

        // when
        offerService.expire(created);

        // then
        assertThat(offerRepository.findById(created).orElseThrow().getStatus()).isEqualTo(OfferStatus.EXPIRED);
        assertThat(taskRepository.findById(task.getId()).orElseThrow().getStatus()).isEqualTo(TaskStatus.NONE);
    }

    @Test
    @DisplayName("create - 이미 배정된 작업일 때 섭외하면 INVALID_TASK_STATUS로 실패한다")
    void create_assignedTask() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("owner", "01000001001", Role.PLAN));
        val worker = memberRepository.save(MemberFactory.entity("worker", "01000001002", Role.CAREER));
        val next = memberRepository.save(MemberFactory.entity("next", "01000001003", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val ownerUser = UserFactory.domain(owner.getId(), Role.PLAN);
        val created = offerService.create(ownerUser, OfferFactory.command(task.getId(), worker.getId()));
        offerService.accept(UserFactory.domain(worker.getId(), Role.CAREER), created);

        // when & then
        assertCodeException(() -> offerService.create(ownerUser, OfferFactory.command(task.getId(), next.getId())))
                .hasExceptionCode(OfferExceptionCode.INVALID_TASK_STATUS);
    }

    @Test
    @DisplayName("accept - 섭외를 수락하면 작업이 ASSIGNED가 된다")
    void accept_assigned() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("owner", "01000001001", Role.PLAN));
        val worker = memberRepository.save(MemberFactory.entity("worker", "01000001002", Role.CAREER));
        val company = companyRepository.save(CompanyFactory.entity(owner.getId()));
        val project = projectRepository.save(ProjectFactory.entity(company.getId()));
        val task = taskRepository.save(TaskFactory.projectEntity(project.getId(), null));
        val ownerUser = UserFactory.domain(owner.getId(), Role.PLAN);
        val created = offerService.create(ownerUser, OfferFactory.command(task.getId(), worker.getId()));

        // when
        offerService.accept(UserFactory.domain(worker.getId(), Role.CAREER), created);

        // then
        val found = taskRepository.findById(task.getId()).orElseThrow();
        assertThat(found.getStatus()).isEqualTo(TaskStatus.ASSIGNED);
        assertThat(found.getWorkerId()).isEqualTo(worker.getId());
    }
}
