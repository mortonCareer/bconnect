package to.bconnect.api.core.domain.notification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationTypeEntity;
import to.bconnect.api.storage.notification.NotificationTypeRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationTypeRegistryTest {

    private FakeNotificationTypeRepository repository;
    private NotificationTypeRegistry registry;

    @BeforeEach
    void setUp() {
        repository = new FakeNotificationTypeRepository();
        registry = new NotificationTypeRegistry();
    }

    @Test
    @DisplayName("빈 레지스트리에 시딩하면 CHAT_MESSAGE 타입이 생성된다")
    void seed_insertsWhenAbsent() {
        registry.upsertAll(repository);

        NotificationTypeEntity seeded = repository.findByCode("CHAT_MESSAGE").orElseThrow();
        assertThat(seeded.getReferenceType()).isEqualTo(NotificationReferenceType.CHAT_ROOM);
        assertThat(seeded.getMessage()).isEqualTo("{sender}님이 메시지를 보냈습니다");
    }

    @Test
    @DisplayName("이미 같은 code 가 있으면 중복 생성 없이 문구/딥링크 타입이 최신으로 갱신된다")
    void seed_updatesWhenPresent() {
        repository.save(new NotificationTypeEntity("CHAT_MESSAGE", NotificationReferenceType.CHAT_ROOM, "옛날 문구"));

        registry.upsertAll(repository);

        assertThat(repository.count()).isEqualTo(1);
        NotificationTypeEntity updated = repository.findByCode("CHAT_MESSAGE").orElseThrow();
        assertThat(updated.getMessage()).isEqualTo("{sender}님이 메시지를 보냈습니다");
    }

    @Test
    @DisplayName("시딩을 두 번 돌려도 행이 중복되지 않는다(멱등)")
    void seed_isIdempotent() {
        registry.upsertAll(repository);
        registry.upsertAll(repository);

        assertThat(repository.count()).isEqualTo(1);
    }

    private static class FakeNotificationTypeRepository implements NotificationTypeRepository {
        private final java.util.Map<Long, NotificationTypeEntity> store = new java.util.HashMap<>();
        private long sequence = 0;

        @Override
        public Optional<NotificationTypeEntity> findByCode(String code) {
            return store.values().stream().filter(it -> it.getCode().equals(code)).findFirst();
        }

        @Override
        public List<NotificationTypeEntity> findByCodeIn(java.util.Collection<String> codes) {
            return store.values().stream().filter(it -> codes.contains(it.getCode())).toList();
        }

        @Override
        public <S extends NotificationTypeEntity> S save(S entity) {
            Long id = entity.getId();
            if (id == null) {
                id = ++sequence;
                try {
                    var field = to.bconnect.api.storage.BaseEntity.class.getDeclaredField("id");
                    field.setAccessible(true);
                    field.set(entity, id);
                } catch (ReflectiveOperationException e) {
                    throw new IllegalStateException(e);
                }
            }
            store.put(id, entity);
            return entity;
        }

        @Override
        public long count() {
            return store.size();
        }

        @Override public List<NotificationTypeEntity> findAll() { throw new UnsupportedOperationException(); }
        @Override public List<NotificationTypeEntity> findAll(org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public org.springframework.data.domain.Page<NotificationTypeEntity> findAll(org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public List<NotificationTypeEntity> findAllById(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationTypeEntity> List<S> saveAll(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public Optional<NotificationTypeEntity> findById(Long id) { return Optional.ofNullable(store.get(id)); }
        @Override public boolean existsById(Long id) { return store.containsKey(id); }
        @Override public void deleteById(Long id) { store.remove(id); }
        @Override public void delete(NotificationTypeEntity entity) { store.remove(entity.getId()); }
        @Override public void deleteAll() { store.clear(); }
        @Override public void deleteAll(Iterable<? extends NotificationTypeEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) { throw new UnsupportedOperationException(); }
        @Override public void flush() {  }
        @Override public <S extends NotificationTypeEntity> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends NotificationTypeEntity> List<S> saveAllAndFlush(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllInBatch() { store.clear(); }
        @Override public void deleteAllInBatch(Iterable<NotificationTypeEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public NotificationTypeEntity getOne(Long id) { throw new UnsupportedOperationException(); }
        @Override public NotificationTypeEntity getById(Long id) { throw new UnsupportedOperationException(); }
        @Override public NotificationTypeEntity getReferenceById(Long id) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationTypeEntity> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationTypeEntity> List<S> findAll(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationTypeEntity> List<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationTypeEntity> org.springframework.data.domain.Page<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationTypeEntity> long count(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationTypeEntity> boolean exists(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationTypeEntity, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { throw new UnsupportedOperationException(); }
    }
}
