package to.bconnect.api.core.domain.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.IntFunction;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class NotificationQueryServiceTest {

    private static final AuthUser USER_A = new AuthUser(1L, "1", "WORKER");
    private static final AuthUser USER_B = new AuthUser(2L, "2", "WORKER");

    private FakeNotificationRepository repository;
    private NotificationQueryService service;

    @BeforeEach
    void setUp() {
        repository = new FakeNotificationRepository();
        service = new NotificationQueryService(repository);
    }

    private NotificationEntity chat(Long receiverId) {
        return new NotificationEntity(9L, receiverId, "CHAT_MESSAGE", 42L, "안녕");
    }

    @Test
    @DisplayName("목록은 본인 수신 알림만, 도메인 record 로 변환되어 반환된다")
    void list_returnsOnlyOwnNotifications() {
        repository.save(chat(USER_A.id()));
        repository.save(chat(USER_A.id()));
        repository.save(chat(USER_B.id()));

        var page = service.list(USER_A, new CursorLimit(null, null, null));

        assertThat(page.content()).hasSize(2);
        assertThat(page.content()).allSatisfy(n -> assertThat(n.receiverId()).isEqualTo(USER_A.id()));
    }

    @Test
    @DisplayName("안읽음 카운트는 readAt 이 null 인 본인 알림 수다")
    void unreadCount_countsUnreadOwn() {
        repository.save(chat(USER_A.id()));
        var read = repository.save(chat(USER_A.id()));
        read.markRead();
        repository.save(chat(USER_B.id()));

        assertThat(service.unreadCount(USER_A)).isEqualTo(1);
    }

    @Test
    @DisplayName("본인 알림 읽음 처리 시 readAt 이 채워진다")
    void markRead_setsReadAt() {
        var saved = repository.save(chat(USER_A.id()));

        service.markRead(USER_A, saved.getId());

        assertThat(repository.findById(saved.getId()).orElseThrow().isRead()).isTrue();
    }

    @Test
    @DisplayName("없는 알림 읽음 처리는 NOT_FOUND")
    void markRead_missing_throwsNotFound() {
        assertThatThrownBy(() -> service.markRead(USER_A, 999L))
                .isInstanceOf(CodeException.class)
                .extracting("exceptionCode")
                .isEqualTo(NotificationExceptionCode.NOT_FOUND);
    }

    @Test
    @DisplayName("남의 알림 읽음 처리는 FORBIDDEN")
    void markRead_otherUser_throwsForbidden() {
        var saved = repository.save(chat(USER_B.id()));

        assertThatThrownBy(() -> service.markRead(USER_A, saved.getId()))
                .isInstanceOf(CodeException.class)
                .extracting("exceptionCode")
                .isEqualTo(NotificationExceptionCode.FORBIDDEN);
    }

    @Test
    @DisplayName("모두 읽음은 본인 미읽음만 갱신하고 남의 알림은 건드리지 않는다")
    void markAllRead_onlyOwnUnread() {
        var a1 = repository.save(chat(USER_A.id()));
        var a2 = repository.save(chat(USER_A.id()));
        var b1 = repository.save(chat(USER_B.id()));

        service.markAllRead(USER_A);

        assertThat(a1.isRead()).isTrue();
        assertThat(a2.isRead()).isTrue();
        assertThat(b1.isRead()).isFalse();
    }

    private static class FakeNotificationRepository implements NotificationRepository {
        private final List<NotificationEntity> store = new ArrayList<>();
        private long sequence = 0;

        @Override
        public org.springframework.data.domain.Window<NotificationEntity> findByReceiverId(
                Long receiverId, org.springframework.data.domain.ScrollPosition position,
                org.springframework.data.domain.Limit limit, org.springframework.data.domain.Sort sort) {
            var content = store.stream()
                    .filter(it -> it.getReceiverId().equals(receiverId))
                    .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                    .toList();
            IntFunction<org.springframework.data.domain.ScrollPosition> pos =
                    i -> org.springframework.data.domain.ScrollPosition.keyset();
            return org.springframework.data.domain.Window.from(content, pos);
        }

        @Override
        public long countByReceiverIdAndReadAtIsNull(Long receiverId) {
            return store.stream()
                    .filter(it -> it.getReceiverId().equals(receiverId) && it.getReadAt() == null)
                    .count();
        }

        @Override
        public int markAllReadByReceiverId(Long receiverId, Instant now) {
            int updated = 0;
            for (var it : store) {
                if (it.getReceiverId().equals(receiverId) && it.getReadAt() == null) {
                    it.markRead();
                    updated++;
                }
            }
            return updated;
        }

        @Override
        public <S extends NotificationEntity> S save(S entity) {
            if (entity.getId() == null) {
                try {
                    var field = to.bconnect.api.storage.BaseEntity.class.getDeclaredField("id");
                    field.setAccessible(true);
                    field.set(entity, ++sequence);
                } catch (ReflectiveOperationException e) {
                    throw new IllegalStateException(e);
                }
            }
            store.add(entity);
            return entity;
        }

        @Override
        public Optional<NotificationEntity> findById(Long id) {
            return store.stream().filter(it -> id.equals(it.getId())).findFirst();
        }

        @Override public List<NotificationEntity> findAll() { throw new UnsupportedOperationException(); }
        @Override public List<NotificationEntity> findAll(org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public org.springframework.data.domain.Page<NotificationEntity> findAll(org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public List<NotificationEntity> findAllById(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationEntity> List<S> saveAll(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public boolean existsById(Long id) { throw new UnsupportedOperationException(); }
        @Override public long count() { return store.size(); }
        @Override public void deleteById(Long id) { throw new UnsupportedOperationException(); }
        @Override public void delete(NotificationEntity entity) { store.remove(entity); }
        @Override public void deleteAll() { store.clear(); }
        @Override public void deleteAll(Iterable<? extends NotificationEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) { throw new UnsupportedOperationException(); }
        @Override public void flush() { }
        @Override public <S extends NotificationEntity> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends NotificationEntity> List<S> saveAllAndFlush(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllInBatch() { store.clear(); }
        @Override public void deleteAllInBatch(Iterable<NotificationEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public NotificationEntity getOne(Long id) { throw new UnsupportedOperationException(); }
        @Override public NotificationEntity getById(Long id) { throw new UnsupportedOperationException(); }
        @Override public NotificationEntity getReferenceById(Long id) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationEntity> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationEntity> List<S> findAll(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationEntity> List<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationEntity> org.springframework.data.domain.Page<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationEntity> long count(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationEntity> boolean exists(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationEntity, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { throw new UnsupportedOperationException(); }
    }
}
