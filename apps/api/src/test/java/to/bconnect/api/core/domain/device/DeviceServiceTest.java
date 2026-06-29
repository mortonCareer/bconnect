package to.bconnect.api.core.domain.device;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.device.DevicePlatform;
import to.bconnect.api.storage.device.DeviceTokenEntity;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.support.push.PushEndpointRegistry;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

class DeviceServiceTest {

    private FakeDeviceTokenRepository repository;
    private DeviceService deviceService;

    private static final AuthUser USER_A = new AuthUser(1L, "1", "WORKER");
    private static final AuthUser USER_B = new AuthUser(2L, "2", "WORKER");
    private static final String TOKEN = "fcm-token-abc";

    @BeforeEach
    void setUp() {
        repository = new FakeDeviceTokenRepository();
        PushEndpointRegistry fakeRegistry = new PushEndpointRegistry() {
            @Override
            public String ensureEndpoint(String token) {
                return "arn:fake:" + token;
            }

            @Override
            public void deleteEndpoint(String endpointArn) {
            }
        };
        deviceService = new DeviceService(repository, fakeRegistry);
    }

    @Test
    @DisplayName("새 token 등록 시 device row 가 생성되고 endpoint ARN 이 저장된다")
    void register_new() {
        deviceService.register(USER_A, TOKEN, DevicePlatform.web);

        DeviceTokenEntity saved = repository.findByToken(TOKEN).orElseThrow();
        assertThat(repository.count()).isEqualTo(1);
        assertThat(saved.getMemberId()).isEqualTo(USER_A.id());
        assertThat(saved.getPlatform()).isEqualTo(DevicePlatform.web);
        assertThat(saved.getSnsEndpointArn()).isEqualTo("arn:fake:" + TOKEN);
        assertThat(saved.isEnabled()).isTrue();
    }

    @Test
    @DisplayName("같은 token 재등록 시 중복 row 없이 last_active_at 가 갱신된다")
    void register_sameToken_noDuplicate() {
        deviceService.register(USER_A, TOKEN, DevicePlatform.web);
        var before = repository.findByToken(TOKEN).orElseThrow().getLastActiveAt();

        deviceService.register(USER_A, TOKEN, DevicePlatform.web);
        var after = repository.findByToken(TOKEN).orElseThrow().getLastActiveAt();

        assertThat(repository.count()).isEqualTo(1);
        assertThat(after).isAfterOrEqualTo(before);
    }

    @Test
    @DisplayName("같은 token 을 다른 사용자로 등록하면 소유자(memberId)가 현재 사용자로 갱신된다")
    void register_sameToken_reassignOwner() {
        deviceService.register(USER_A, TOKEN, DevicePlatform.web);

        deviceService.register(USER_B, TOKEN, DevicePlatform.web);

        DeviceTokenEntity row = repository.findByToken(TOKEN).orElseThrow();
        assertThat(repository.count()).isEqualTo(1);
        assertThat(row.getMemberId()).isEqualTo(USER_B.id());
    }

    @Test
    @DisplayName("DELETE 호출 시 현재 사용자 소유 row 가 삭제된다")
    void unregister_removesRow() {
        deviceService.register(USER_A, TOKEN, DevicePlatform.web);

        deviceService.unregister(USER_A, TOKEN);

        assertThat(repository.findByToken(TOKEN)).isEmpty();
        assertThat(repository.count()).isZero();
    }

    @Test
    @DisplayName("없는 token DELETE 도 예외 없이 성공한다(idempotent)")
    void unregister_nonexistent_isIdempotent() {
        assertThatCode(() -> deviceService.unregister(USER_A, "no-such-token"))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("다른 사용자의 token 은 DELETE 대상이 아니다")
    void unregister_otherUserToken_notDeleted() {
        deviceService.register(USER_A, TOKEN, DevicePlatform.web);

        deviceService.unregister(USER_B, TOKEN);

        assertThat(repository.findByToken(TOKEN)).isPresent();
    }

    private static class FakeDeviceTokenRepository implements DeviceTokenRepository {
        private final java.util.Map<Long, DeviceTokenEntity> store = new java.util.HashMap<>();
        private long sequence = 0;

        @Override
        public Optional<DeviceTokenEntity> findByToken(String token) {
            return store.values().stream().filter(it -> it.getToken().equals(token)).findFirst();
        }

        @Override
        public Optional<DeviceTokenEntity> findByMemberIdAndToken(Long memberId, String token) {
            return store.values().stream()
                    .filter(it -> it.getMemberId().equals(memberId) && it.getToken().equals(token))
                    .findFirst();
        }

        @Override
        public List<DeviceTokenEntity> findByMemberIdAndEnabledTrue(Long memberId) {
            return store.values().stream()
                    .filter(it -> it.getMemberId().equals(memberId) && it.isEnabled())
                    .toList();
        }

        @Override
        public <S extends DeviceTokenEntity> S save(S entity) {
            Long id = entity.getId();
            if (id == null) {
                id = ++sequence;
                try {
                    var field = DeviceTokenEntity.class.getDeclaredField("id");
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
        public void delete(DeviceTokenEntity entity) {
            store.remove(entity.getId());
        }

        @Override
        public long count() {
            return store.size();
        }

        @Override public List<DeviceTokenEntity> findAll() { throw new UnsupportedOperationException(); }
        @Override public List<DeviceTokenEntity> findAll(org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public org.springframework.data.domain.Page<DeviceTokenEntity> findAll(org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public List<DeviceTokenEntity> findAllById(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public <S extends DeviceTokenEntity> List<S> saveAll(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public Optional<DeviceTokenEntity> findById(Long id) { return Optional.ofNullable(store.get(id)); }
        @Override public boolean existsById(Long id) { return store.containsKey(id); }
        @Override public void deleteById(Long id) { store.remove(id); }
        @Override public void deleteAll() { store.clear(); }
        @Override public void deleteAll(Iterable<? extends DeviceTokenEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) { throw new UnsupportedOperationException(); }
        @Override public void flush() {  }
        @Override public <S extends DeviceTokenEntity> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends DeviceTokenEntity> List<S> saveAllAndFlush(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllInBatch() { store.clear(); }
        @Override public void deleteAllInBatch(Iterable<DeviceTokenEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public DeviceTokenEntity getOne(Long id) { throw new UnsupportedOperationException(); }
        @Override public DeviceTokenEntity getById(Long id) { throw new UnsupportedOperationException(); }
        @Override public DeviceTokenEntity getReferenceById(Long id) { throw new UnsupportedOperationException(); }
        @Override public <S extends DeviceTokenEntity> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends DeviceTokenEntity> List<S> findAll(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends DeviceTokenEntity> List<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public <S extends DeviceTokenEntity> org.springframework.data.domain.Page<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public <S extends DeviceTokenEntity> long count(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends DeviceTokenEntity> boolean exists(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends DeviceTokenEntity, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { throw new UnsupportedOperationException(); }
    }
}
