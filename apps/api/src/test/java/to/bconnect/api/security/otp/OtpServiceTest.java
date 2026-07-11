package to.bconnect.api.security.otp;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.AuthExceptionCode;
import to.bconnect.api.storage.otp.OtpEntity;
import to.bconnect.api.storage.otp.OtpRepository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OtpServiceTest {

    private static final String TEST_PHONE = "01000000000";
    private static final String TEST_CODE = "123456";
    private static final String NORMAL_PHONE = "01011112222";

    private FakeOtpRepository repository;
    private RecordingEventPublisher eventPublisher;
    private OtpService service;

    @BeforeEach
    void setUp() {
        repository = new FakeOtpRepository();
        eventPublisher = new RecordingEventPublisher();
        service = new OtpService(repository, eventPublisher,
                new OtpTestProperties(List.of(TEST_PHONE), TEST_CODE));
    }

    @Test
    @DisplayName("테스트 번호는 일일 한도와 재전송 대기 없이 연속 발송된다")
    void testNumberBypassesSendLimits() {
        assertThatCode(() -> {
            for (int i = 0; i < 12; i++) service.sendCode(TEST_PHONE);
        }).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("테스트 번호는 SMS 발송 이벤트를 발행하지 않는다")
    void testNumberPublishesNoSmsEvent() {
        service.sendCode(TEST_PHONE);

        assertThat(eventPublisher.events).isEmpty();
    }

    @Test
    @DisplayName("테스트 번호는 고정 코드로 검증에 성공한다")
    void testNumberVerifiesWithFixedCode() {
        service.sendCode(TEST_PHONE);

        assertThatCode(() -> service.verifyCode(TEST_PHONE, TEST_CODE))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("테스트 번호는 시도 횟수를 소진해도 올바른 코드로 검증된다")
    void testNumberBypassesAttemptLimit() {
        service.sendCode(TEST_PHONE);
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> service.verifyCode(TEST_PHONE, "000000"))
                    .isInstanceOf(CodeException.class);
        }

        assertThatCode(() -> service.verifyCode(TEST_PHONE, TEST_CODE))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("일반 번호는 재전송 대기 시간이 그대로 적용된다")
    void normalNumberStillRateLimited() {
        service.sendCode(NORMAL_PHONE);

        assertThatThrownBy(() -> service.sendCode(NORMAL_PHONE))
                .isInstanceOf(CodeException.class)
                .extracting(e -> ((CodeException) e).getExceptionCode())
                .isEqualTo(AuthExceptionCode.OTP_RATE_LIMIT);
    }

    @Test
    @DisplayName("일반 번호는 SMS 발송 이벤트가 발행된다")
    void normalNumberPublishesSmsEvent() {
        service.sendCode(NORMAL_PHONE);

        assertThat(eventPublisher.events).hasSize(1);
        assertThat(eventPublisher.events.getFirst())
                .isInstanceOfSatisfying(OtpIssuedEvent.class,
                        event -> assertThat(event.phone()).isEqualTo(NORMAL_PHONE));
    }

    @Test
    @DisplayName("일반 번호는 시도 횟수 초과 시 검증이 차단된다")
    void normalNumberBlockedAfterMaxAttempts() {
        service.sendCode(NORMAL_PHONE);
        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> service.verifyCode(NORMAL_PHONE, "999999"))
                    .isInstanceOf(CodeException.class);
        }

        OtpEntity found = repository.findByPhone(NORMAL_PHONE).orElseThrow();
        assertThatThrownBy(() -> service.verifyCode(NORMAL_PHONE, found.getCode()))
                .isInstanceOf(CodeException.class)
                .extracting(e -> ((CodeException) e).getExceptionCode())
                .isEqualTo(AuthExceptionCode.OTP_MAX_ATTEMPTS);
    }

    private static class RecordingEventPublisher implements ApplicationEventPublisher {
        private final List<Object> events = new ArrayList<>();

        @Override
        public void publishEvent(Object event) {
            events.add(event);
        }
    }

    private static class FakeOtpRepository implements OtpRepository {
        private final Map<String, OtpEntity> store = new HashMap<>();

        @Override
        public Optional<OtpEntity> findByPhone(String phone) {
            return Optional.ofNullable(store.get(phone));
        }

        @Override
        public <S extends OtpEntity> S save(S entity) {
            store.put(entity.getPhone(), entity);
            return entity;
        }

        @Override public Optional<OtpEntity> findById(Long id) { throw new UnsupportedOperationException(); }
        @Override public List<OtpEntity> findAll() { throw new UnsupportedOperationException(); }
        @Override public List<OtpEntity> findAll(org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public org.springframework.data.domain.Page<OtpEntity> findAll(org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public List<OtpEntity> findAllById(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public <S extends OtpEntity> List<S> saveAll(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public boolean existsById(Long id) { throw new UnsupportedOperationException(); }
        @Override public long count() { return store.size(); }
        @Override public void deleteById(Long id) { throw new UnsupportedOperationException(); }
        @Override public void delete(OtpEntity entity) { throw new UnsupportedOperationException(); }
        @Override public void deleteAll() { store.clear(); }
        @Override public void deleteAll(Iterable<? extends OtpEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) { throw new UnsupportedOperationException(); }
        @Override public void flush() { }
        @Override public <S extends OtpEntity> S saveAndFlush(S entity) { return save(entity); }
        @Override public <S extends OtpEntity> List<S> saveAllAndFlush(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllInBatch() { store.clear(); }
        @Override public void deleteAllInBatch(Iterable<OtpEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllByIdInBatch(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public OtpEntity getOne(Long id) { throw new UnsupportedOperationException(); }
        @Override public OtpEntity getById(Long id) { throw new UnsupportedOperationException(); }
        @Override public OtpEntity getReferenceById(Long id) { throw new UnsupportedOperationException(); }
        @Override public <S extends OtpEntity> Optional<S> findOne(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends OtpEntity> List<S> findAll(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends OtpEntity> List<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public <S extends OtpEntity> org.springframework.data.domain.Page<S> findAll(org.springframework.data.domain.Example<S> example, org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public <S extends OtpEntity> long count(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends OtpEntity> boolean exists(org.springframework.data.domain.Example<S> example) { throw new UnsupportedOperationException(); }
        @Override public <S extends OtpEntity, R> R findBy(org.springframework.data.domain.Example<S> example, java.util.function.Function<org.springframework.data.repository.query.FluentQuery.FetchableFluentQuery<S>, R> queryFunction) { throw new UnsupportedOperationException(); }
    }
}
