package to.bconnect.api.core.domain.post;

import lombok.val;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.Region;
import to.bconnect.api.storage.attachment.AttachmentRepository;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.storage.member.Role;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.profile.ProfileEntity;
import to.bconnect.api.storage.profile.ProfileRepository;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.support.IntegrationTest;
import to.bconnect.api.support.fixture.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static to.bconnect.api.support.CodeExceptionAssert.assertCodeException;

@IntegrationTest
class PostServiceTest {

    private static final Long MISSING_ID = 999_999L;
    private static final SearchFeed EMPTY_FILTER =
            new SearchFeed(null, null, null, null, null, null, null);
    private static final Address BUSAN_ADDRESS = new Address(
            "00000", "0000000000", Region.부산, "city", "street", "detail",
            BigDecimal.ZERO, BigDecimal.ZERO);
    private static final LocalDate FILTER_START = LocalDate.of(2026, 6, 1);
    private static final LocalDate FILTER_END = LocalDate.of(2026, 6, 30);

    @Autowired private PostService postService;
    @Autowired private PostRepository postRepository;
    @Autowired private TaskRepository taskRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private ProfileRepository profileRepository;
    @Autowired private AttachmentRepository attachmentRepository;

    @Test
    @DisplayName("list - 게시글 목록을 커서 페이지네이션 조회하면 페이지를 반환한다")
    void list_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));
        postRepository.save(PostFactory.entity(member.getId(), task.getId()));
        val second = postRepository.save(PostFactory.entity(member.getId(), task.getId()));
        val third = postRepository.save(PostFactory.entity(member.getId(), null));
        val cursor = CursorFactory.request(null, 2);

        // when
        val firstPage = postService.list(EMPTY_FILTER, cursor);

        // then
        assertThat(firstPage.content()).hasSize(2);
        assertThat(firstPage.content().get(0).id()).isEqualTo(third.getId());
        assertThat(firstPage.content().get(1).id()).isEqualTo(second.getId());
        assertThat(firstPage.hasNext()).isTrue();
        assertThat(firstPage.nextCursor()).isEqualTo(second.getId());
    }

    @Test
    @DisplayName("list - 직종 필터로 조회하면 해당 직종 프로필을 가진 회원의 게시글만 반환한다")
    void list_success_trades() {
        // given
        val electrical = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        profileRepository.save(ProfileFactory.entity(electrical.getId()));
        postRepository.save(PostFactory.entity(electrical.getId(), null));

        val plumbing = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        profileRepository.save(new ProfileEntity(
                plumbing.getId(), ProfileRole.FOREMAN, Trade.PLUMBING, Set.of(Trade.PLUMBING), 5,
                "headline", "about", ProfileFactory.DEFAULT_ADDRESS));
        val post = postRepository.save(PostFactory.entity(plumbing.getId(), null));

        val command = new SearchFeed(null, Set.of(Trade.PLUMBING), null, null, null, null, null);

        // when
        val page = postService.list(command, CursorFactory.request(null, 10));

        // then
        assertThat(page.content()).hasSize(1);
        assertThat(page.content().getFirst().id()).isEqualTo(post.getId());
    }

    @Test
    @DisplayName("list - 경력 범위 필터로 조회하면 범위에 속한 회원의 게시글만 반환한다")
    void list_success_experience() {
        // given
        val junior = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        profileRepository.save(new ProfileEntity(
                junior.getId(), ProfileRole.FOREMAN, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL), 11,
                "headline", "about", ProfileFactory.DEFAULT_ADDRESS));
        postRepository.save(PostFactory.entity(junior.getId(), null));

        val middle = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        profileRepository.save(new ProfileEntity(
                middle.getId(), ProfileRole.FOREMAN, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL), 15,
                "headline", "about", ProfileFactory.DEFAULT_ADDRESS));
        val post = postRepository.save(PostFactory.entity(middle.getId(), null));

        val senior = memberRepository.save(MemberFactory.entity("member3", "01000001003", Role.CAREER));
        profileRepository.save(new ProfileEntity(
                senior.getId(), ProfileRole.FOREMAN, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL), 21,
                "headline", "about", ProfileFactory.DEFAULT_ADDRESS));
        postRepository.save(PostFactory.entity(senior.getId(), null));

        val command = new SearchFeed(null, null, 12, 20, null, null, null);

        // when
        val page = postService.list(command, CursorFactory.request(null, 10));

        // then
        assertThat(page.content()).hasSize(1);
        assertThat(page.content().getFirst().id()).isEqualTo(post.getId());
    }

    @Test
    @DisplayName("list - 지역 필터로 조회하면 해당 지역 회원의 게시글만 반환한다")
    void list_success_states() {
        // given
        val seoul = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        profileRepository.save(ProfileFactory.entity(seoul.getId()));
        postRepository.save(PostFactory.entity(seoul.getId(), null));

        val busan = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        profileRepository.save(new ProfileEntity(
                busan.getId(), ProfileRole.FOREMAN, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL), 5,
                "headline", "about", BUSAN_ADDRESS));
        val post = postRepository.save(PostFactory.entity(busan.getId(), null));

        val command = new SearchFeed(null, null, null, null, Set.of(Region.부산), null, null);

        // when
        val page = postService.list(command, CursorFactory.request(null, 10));

        // then
        assertThat(page.content()).hasSize(1);
        assertThat(page.content().getFirst().id()).isEqualTo(post.getId());
    }

    @Test
    @DisplayName("list - 기간 필터로 조회하면 기간에 완전히 포함된 작업의 게시글만 반환한다")
    void list_success_period() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));

        val inside = taskRepository.save(new TaskEntity(
                TaskType.WORKER, Set.of(Trade.ELECTRICAL), FILTER_START, FILTER_END,
                member.getId(), "task", "memo", "company", ProfileFactory.DEFAULT_ADDRESS,
                null, null, null, null));
        val post = postRepository.save(PostFactory.entity(member.getId(), inside.getId()));

        val early = taskRepository.save(new TaskEntity(
                TaskType.WORKER, Set.of(Trade.ELECTRICAL), FILTER_START.minusDays(1), FILTER_END,
                member.getId(), "task", "memo", "company", ProfileFactory.DEFAULT_ADDRESS,
                null, null, null, null));
        postRepository.save(PostFactory.entity(member.getId(), early.getId()));

        val late = taskRepository.save(new TaskEntity(
                TaskType.WORKER, Set.of(Trade.ELECTRICAL), FILTER_START, FILTER_END.plusDays(1),
                member.getId(), "task", "memo", "company", ProfileFactory.DEFAULT_ADDRESS,
                null, null, null, null));
        postRepository.save(PostFactory.entity(member.getId(), late.getId()));

        postRepository.save(PostFactory.entity(member.getId(), null));

        val command = new SearchFeed(null, null, null, null, null, FILTER_START, FILTER_END);

        // when
        val page = postService.list(command, CursorFactory.request(null, 10));

        // then
        assertThat(page.content()).hasSize(1);
        assertThat(page.content().getFirst().id()).isEqualTo(post.getId());
    }

    @Test
    @DisplayName("get - 게시글이 존재할 때 식별자로 조회하면 게시글을 반환한다")
    void get_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));
        val post = postRepository.save(PostFactory.entity(member.getId(), task.getId()));

        // when
        val found = postService.get(post.getId());

        // then
        assertThat(found.id()).isEqualTo(post.getId());
        assertThat(found.memberId()).isEqualTo(member.getId());
        assertThat(found.taskId()).isEqualTo(task.getId());
    }

    @Test
    @DisplayName("create - 등록 정보가 유효할 때 등록하면 게시글이 저장되고 첨부가 게시글에 연결된다")
    void create_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = PostFactory.createCommand(task.getId(), attachment.getId());

        // when
        val postId = postService.create(user, command);

        // then
        val created = postRepository.findById(postId).orElseThrow();
        assertThat(created.getMemberId()).isEqualTo(member.getId());
        assertThat(created.getTaskId()).isEqualTo(task.getId());
        val linked = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(linked.getReferenceType()).isEqualTo(AttachmentReferenceType.POST);
        assertThat(linked.getReferenceId()).isEqualTo(postId);
    }

    @Test
    @DisplayName("update - 내 게시글일 때 수정하면 작업이 연결되고 기존 첨부가 해제되며 새 첨부가 연결된다")
    void update_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));
        val post = postRepository.save(PostFactory.entity(member.getId(), null));
        val first = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        first.complete();
        first.link(AttachmentReferenceType.POST, post.getId());
        val second = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        second.complete();
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = PostFactory.updateCommand(task.getId(), second.getId());

        // when
        postService.update(user, post.getId(), command);

        // then
        val found = postRepository.findById(post.getId()).orElseThrow();
        assertThat(found.getTaskId()).isEqualTo(task.getId());
        assertThat(found.getContent()).isEqualTo(command.content());
        val unlinked = attachmentRepository.findById(first.getId()).orElseThrow();
        assertThat(unlinked.getReferenceType()).isNull();
        assertThat(unlinked.getReferenceId()).isNull();
        val linked = attachmentRepository.findById(second.getId()).orElseThrow();
        assertThat(linked.getReferenceType()).isEqualTo(AttachmentReferenceType.POST);
        assertThat(linked.getReferenceId()).isEqualTo(post.getId());
    }

    @Test
    @DisplayName("update - 작업이 연결된 게시글일 때 작업 없이 수정하면 작업 연결이 해제된다")
    void update_success_detach() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(member.getId()));
        val post = postRepository.save(PostFactory.entity(member.getId(), task.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = new UpdatePost(null, List.of(), "updated content");

        // when
        postService.update(user, post.getId(), command);

        // then
        val found = postRepository.findById(post.getId()).orElseThrow();
        assertThat(found.getTaskId()).isNull();
        assertThat(found.getContent()).isEqualTo(command.content());
    }

    @Test
    @DisplayName("delete - 내 게시글일 때 삭제하면 게시글이 삭제되고 첨부 참조가 해제된다")
    void delete_success() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val post = postRepository.save(PostFactory.entity(member.getId(), null));
        val attachment = attachmentRepository.save(AttachmentFactory.entity(member.getId(), member.getId()));
        attachment.complete();
        attachment.link(AttachmentReferenceType.POST, post.getId());
        val user = UserFactory.domain(member.getId(), Role.CAREER);

        // when
        postService.delete(user, post.getId());

        // then
        assertThat(postRepository.findAllByMemberId(member.getId())).isEmpty();
        val found = attachmentRepository.findById(attachment.getId()).orElseThrow();
        assertThat(found.getReferenceType()).isNull();
        assertThat(found.getReferenceId()).isNull();
    }

    @Test
    @DisplayName("get - 게시글이 존재하지 않을 때 식별자로 조회하면 NOT_FOUND로 실패한다")
    void get_fail_C005() {
        // when & then
        assertCodeException(() -> postService.get(MISSING_ID))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("create - 다른 회원의 작업을 참조하여 등록하면 FORBIDDEN으로 실패한다")
    void create_fail_C004_task() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val task = taskRepository.save(TaskFactory.entity(other.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = new CreatePost(task.getId(), List.of(), "content");

        // when & then
        assertCodeException(() -> postService.create(user, command))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("create - 작업이 존재하지 않을 때 등록하면 NOT_FOUND로 실패한다")
    void create_fail_C005_task() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = new CreatePost(MISSING_ID, List.of(), "content");

        // when & then
        assertCodeException(() -> postService.create(user, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("update - 다른 회원의 게시글일 때 수정하면 FORBIDDEN으로 실패한다")
    void update_fail_C004_post() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val post = postRepository.save(PostFactory.entity(owner.getId(), null));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(other.getId(), Role.CAREER);
        val command = new UpdatePost(null, List.of(), "updated content");

        // when & then
        assertCodeException(() -> postService.update(user, post.getId(), command))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("update - 다른 회원의 작업을 참조하여 수정하면 FORBIDDEN으로 실패한다")
    void update_fail_C004_task() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val post = postRepository.save(PostFactory.entity(member.getId(), null));
        val task = taskRepository.save(TaskFactory.entity(other.getId()));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = new UpdatePost(task.getId(), List.of(), "updated content");

        // when & then
        assertCodeException(() -> postService.update(user, post.getId(), command))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("update - 게시글이 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005_post() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = new UpdatePost(null, List.of(), "updated content");

        // when & then
        assertCodeException(() -> postService.update(user, MISSING_ID, command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("update - 작업이 존재하지 않을 때 수정하면 NOT_FOUND로 실패한다")
    void update_fail_C005_task() {
        // given
        val member = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val post = postRepository.save(PostFactory.entity(member.getId(), null));
        val user = UserFactory.domain(member.getId(), Role.CAREER);
        val command = new UpdatePost(MISSING_ID, List.of(), "updated content");

        // when & then
        assertCodeException(() -> postService.update(user, post.getId(), command))
                .hasExceptionCode(CommonExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("delete - 다른 회원의 게시글일 때 삭제하면 FORBIDDEN으로 실패한다")
    void delete_fail_C004() {
        // given
        val owner = memberRepository.save(MemberFactory.entity("member1", "01000001001", Role.CAREER));
        val post = postRepository.save(PostFactory.entity(owner.getId(), null));
        val other = memberRepository.save(MemberFactory.entity("member2", "01000001002", Role.CAREER));
        val user = UserFactory.domain(other.getId(), Role.CAREER);

        // when & then
        assertCodeException(() -> postService.delete(user, post.getId()))
                .hasExceptionCode(CommonExceptionCode.FORBIDDEN);
    }
}
