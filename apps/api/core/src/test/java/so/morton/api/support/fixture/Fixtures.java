package so.morton.api.support.fixture;

import so.morton.api.domain.coworker.Coworker;
import so.morton.api.domain.coworker.CoworkerRequest;
import so.morton.api.domain.credential.Credential;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.post.Post;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.task.Task;
import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.domain.post.PostEntity;
import so.morton.api.storage.domain.profile.ProfileEntity;
import so.morton.api.storage.domain.task.TaskEntity;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.value.CredentialStatus;
import so.morton.api.storage.value.CredentialType;
import so.morton.api.storage.value.Role;
import so.morton.api.storage.value.Trade;
import so.morton.api.support.auth.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public class Fixtures {

    public static final Address ADDRESS = new Address(
            "00000", "city", "state", "street", "detail",
            BigDecimal.ZERO, BigDecimal.ZERO
    );

    public static final User SKILLED_USER = new User(0L, "username", "SKILLED");
    public static final User CONTRACTOR_USER = new User(0L, "username", "CONTRACTOR");
    public static final User ADMIN_USER = new User(0L, "username", "ADMIN");

    // === Domain object factories ===

    public static Task task(Long id, Long profileId) {
        return new Task(
                id, profileId, "company", ADDRESS, "task", "event",
                Set.of(Trade.ELECTRICAL), LocalDate.now(), LocalDate.now().plusDays(7),
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    public static Profile profile(Long id, Long memberId) {
        return new Profile(
                id, memberId, Trade.ELECTRICAL, Set.of(Trade.ELECTRICAL),
                5, "headline", "about", ADDRESS,
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    public static Member member(Long id) {
        return new Member(
                id, "username", "name", "phone", "picture",
                Role.SKILLED, LocalDateTime.now(), LocalDateTime.now()
        );
    }

    public static Post post(Long id, Long authorId, Long taskId) {
        return new Post(
                id, authorId, taskId, List.of("image"), "content",
                LocalDateTime.now(), LocalDateTime.now()
        );
    }

    public static Coworker coworker(Long id, Long minId, Long maxId) {
        return new Coworker(id, minId, maxId);
    }

    public static CoworkerRequest coworkerRequest(Long id, Long fromId, Long toId) {
        return new CoworkerRequest(id, fromId, toId);
    }

    public static Credential credential(Long id, Long profileId) {
        return new Credential(
                id, profileId, CredentialType.IDENTITY_VERIFICATION, CredentialStatus.PENDING,
                LocalDate.now(), LocalDateTime.now(), LocalDateTime.now()
        );
    }

    // === Entity factories (unsaved) ===

    public static TaskEntity taskEntity(Long profileId) {
        return TaskEntity.builder()
                .profileId(profileId)
                .company("company")
                .address(ADDRESS)
                .taskTitle("task")
                .eventTitle("event")
                .trades(Set.of(Trade.ELECTRICAL))
                .start(LocalDate.now())
                .end(LocalDate.now().plusDays(7))
                .build();
    }

    public static PostEntity postEntity(Long authorId, Long taskId) {
        return PostEntity.builder()
                .authorId(authorId)
                .taskId(taskId)
                .images(List.of("image"))
                .content("content")
                .build();
    }

    public static ProfileEntity profileEntity(Long memberId) {
        return ProfileEntity.builder()
                .memberId(memberId)
                .primaryTrade(Trade.ELECTRICAL)
                .trades(Set.of(Trade.ELECTRICAL))
                .experience(5)
                .headline("headline")
                .about("about")
                .address(ADDRESS)
                .build();
    }

    public static MemberEntity memberEntity(String username, String phone) {
        return MemberEntity.builder()
                .username(username)
                .name("name")
                .phone(phone)
                .picture("picture")
                .role(Role.SKILLED)
                .build();
    }
}
