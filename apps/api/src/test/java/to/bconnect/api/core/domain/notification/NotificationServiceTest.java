package to.bconnect.api.core.domain.notification;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.device.DevicePlatform;
import to.bconnect.api.storage.device.DeviceTokenEntity;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationRepository;
import to.bconnect.api.storage.notification.NotificationTypeEntity;
import to.bconnect.api.storage.notification.NotificationTypeRepository;
import to.bconnect.api.support.push.PushPayload;
import to.bconnect.api.support.push.PushSendResult;
import to.bconnect.api.support.push.PushSender;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationServiceTest {

    private static final Long SENDER = 1L;
    private static final Long CHAT_ID = 50L;

    @Test
    @DisplayName("DB 알림은 활성/비활성 구분 없이 (참여자 전원)에게 저장된다 — 활성 사용자도 히스토리 보존")
    void notify_savesRowForEveryRecipient() {
        var repo = new FakeNotificationRepository();
        var publisher = new CapturingPublisher();
        var service = service(repo, publisher, null, null, null, null);

        service.notifyChatMessage(SENDER, CHAT_ID, List.of(10L, 11L, 12L), Set.of(11L), "안녕");

        assertThat(repo.store).hasSize(3);
        assertThat(repo.store).extracting(NotificationEntity::getReceiverId)
                .containsExactlyInAnyOrder(10L, 11L, 12L);
        assertThat(repo.store).allSatisfy(n -> {
            assertThat(n.getTypeCode()).isEqualTo("CHAT_MESSAGE");
            assertThat(n.getReferenceId()).isEqualTo(CHAT_ID);
            assertThat(n.getContent()).isEqualTo("안녕");
            assertThat(n.getSenderId()).isEqualTo(SENDER);
        });
    }

    @Test
    @DisplayName("푸시 대상은 활성 사용자를 제외한 비활성 수신자뿐이다")
    void notify_pushTargetsExcludeActive() {
        var repo = new FakeNotificationRepository();
        var publisher = new CapturingPublisher();
        var service = service(repo, publisher, null, null, null, null);

        service.notifyChatMessage(SENDER, CHAT_ID, List.of(10L, 11L, 12L), Set.of(11L), "안녕");

        assertThat(publisher.events).hasSize(1);
        var event = (ChatPushRequested) publisher.events.getFirst();
        assertThat(event.targetNotificationIds().keySet()).containsExactlyInAnyOrder(10L, 12L);
    }

    @Test
    @DisplayName("수신자가 없으면 저장도 이벤트도 없다")
    void notify_emptyRecipients_noop() {
        var repo = new FakeNotificationRepository();
        var publisher = new CapturingPublisher();
        var service = service(repo, publisher, null, null, null, null);

        service.notifyChatMessage(SENDER, CHAT_ID, List.of(), Set.of(), "안녕");

        assertThat(repo.store).isEmpty();
        assertThat(publisher.events).isEmpty();
    }

    @Test
    @DisplayName("수신자가 전부 활성이면 DB 는 저장하되 푸시 이벤트는 발행하지 않는다")
    void notify_allActive_savesButNoEvent() {
        var repo = new FakeNotificationRepository();
        var publisher = new CapturingPublisher();
        var service = service(repo, publisher, null, null, null, null);

        service.notifyChatMessage(SENDER, CHAT_ID, List.of(10L), Set.of(10L), "안녕");

        assertThat(repo.store).hasSize(1);
        assertThat(publisher.events).isEmpty();
    }

    @Test
    @DisplayName("발송 시 {sender} 가 현재 이름으로 렌더되고, 대상의 활성 디바이스 endpoint 로만 전송된다")
    void dispatch_rendersSenderAndSendsToEnabledDevices() {
        var typeRepo = new FakeNotificationTypeRepository();
        typeRepo.save(new NotificationTypeEntity("CHAT_MESSAGE", NotificationReferenceType.CHAT_ROOM,
                "{sender}님이 메시지를 보냈습니다"));
        var deviceRepo = new FakeDeviceTokenRepository();
        deviceRepo.save(new DeviceTokenEntity(10L, "tok-10", DevicePlatform.web, "arn:device:10"));
        var sender = new CapturingPushSender();
        MemberResolver resolver = new MemberResolver(null) {
            @Override
            public Member find(Long memberId) {
                return new Member(memberId, "u" + memberId, "홍길동", "010", null, null, null, null);
            }
        };
        var service = service(null, null, typeRepo, deviceRepo, resolver, sender);

        service.dispatchChatPush(new ChatPushRequested(SENDER, CHAT_ID, "안녕하세요", Map.of(10L, 100L)));

        assertThat(sender.sent).hasSize(1);
        var sent = sender.sent.getFirst();
        assertThat(sent.endpointArn()).isEqualTo("arn:device:10");
        assertThat(sent.payload().title()).isEqualTo("홍길동님이 메시지를 보냈습니다");
        assertThat(sent.payload().body()).isEqualTo("안녕하세요");
        assertThat(sent.payload().url()).isEqualTo("/n/chat_room/" + CHAT_ID);
        assertThat(sent.payload().data())
                .containsEntry("notification_id", "100")
                .containsEntry("reference_type", "chat_room")
                .containsEntry("reference_id", String.valueOf(CHAT_ID));
    }

    @Test
    @DisplayName("비활성(enabled=false) 디바이스에는 발송하지 않는다")
    void dispatch_skipsDisabledDevices() {
        var typeRepo = new FakeNotificationTypeRepository();
        typeRepo.save(new NotificationTypeEntity("CHAT_MESSAGE", NotificationReferenceType.CHAT_ROOM, "{sender} msg"));
        var deviceRepo = new FakeDeviceTokenRepository();
        var sender = new CapturingPushSender();
        MemberResolver resolver = new MemberResolver(null) {
            @Override
            public Member find(Long memberId) {
                return new Member(memberId, "u", "n", "010", null, null, null, null);
            }
        };
        var service = service(null, null, typeRepo, deviceRepo, resolver, sender);

        service.dispatchChatPush(new ChatPushRequested(SENDER, CHAT_ID, "안녕", Map.of(10L, 100L)));

        assertThat(sender.sent).isEmpty();
    }

    @Test
    @DisplayName("발송 결과가 EXPIRED 면 해당 디바이스가 비활성화된다")
    void dispatch_disablesExpiredEndpoint() {
        var typeRepo = new FakeNotificationTypeRepository();
        typeRepo.save(new NotificationTypeEntity("CHAT_MESSAGE", NotificationReferenceType.CHAT_ROOM, "{sender} msg"));
        var deviceRepo = new FakeDeviceTokenRepository();
        var device = deviceRepo.save(new DeviceTokenEntity(10L, "tok-10", DevicePlatform.web, "arn:device:10"));
        var sender = new CapturingPushSender();
        sender.statusToReturn = PushSendResult.Status.EXPIRED;
        var service = service(null, null, typeRepo, deviceRepo, resolverReturning("n"), sender);

        service.dispatchChatPush(new ChatPushRequested(SENDER, CHAT_ID, "안녕", Map.of(10L, 100L)));

        assertThat(device.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("발송 결과가 FAILED(일시 실패) 면 디바이스를 비활성화하지 않는다")
    void dispatch_keepsDeviceOnTransientFailure() {
        var typeRepo = new FakeNotificationTypeRepository();
        typeRepo.save(new NotificationTypeEntity("CHAT_MESSAGE", NotificationReferenceType.CHAT_ROOM, "{sender} msg"));
        var deviceRepo = new FakeDeviceTokenRepository();
        var device = deviceRepo.save(new DeviceTokenEntity(10L, "tok-10", DevicePlatform.web, "arn:device:10"));
        var sender = new CapturingPushSender();
        sender.statusToReturn = PushSendResult.Status.FAILED;
        var service = service(null, null, typeRepo, deviceRepo, resolverReturning("n"), sender);

        service.dispatchChatPush(new ChatPushRequested(SENDER, CHAT_ID, "안녕", Map.of(10L, 100L)));

        assertThat(device.isEnabled()).isTrue();
    }

    private MemberResolver resolverReturning(String name) {
        return new MemberResolver(null) {
            @Override
            public Member find(Long memberId) {
                return new Member(memberId, "u", name, "010", null, null, null, null);
            }
        };
    }

    private NotificationService service(NotificationRepository notificationRepository,
                                       ApplicationEventPublisher publisher,
                                       NotificationTypeRepository typeRepository,
                                       DeviceTokenRepository deviceRepository,
                                       MemberResolver memberResolver,
                                       PushSender pushSender) {
        return new NotificationService(notificationRepository, typeRepository, deviceRepository,
                memberResolver, pushSender, publisher);
    }

    private static class CapturingPublisher implements ApplicationEventPublisher {
        final List<Object> events = new ArrayList<>();

        @Override
        public void publishEvent(Object event) {
            events.add(event);
        }
    }

    private static class CapturingPushSender implements PushSender {
        record Sent(String endpointArn, PushPayload payload) {}

        final List<Sent> sent = new ArrayList<>();
        PushSendResult.Status statusToReturn = PushSendResult.Status.SUCCESS;

        @Override
        public PushSendResult send(String endpointArn, PushPayload payload) {
            sent.add(new Sent(endpointArn, payload));
            return new PushSendResult(endpointArn, statusToReturn, "test");
        }
    }

    private static void assignId(Object entity, Long id) {
        try {
            var field = to.bconnect.api.storage.BaseEntity.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }

    private static class FakeNotificationRepository implements NotificationRepository {
        final List<NotificationEntity> store = new ArrayList<>();
        private long sequence = 0;

        @Override
        public <S extends NotificationEntity> S save(S entity) {
            if (entity.getId() == null) assignId(entity, ++sequence);
            store.add(entity);
            return entity;
        }

        @Override public org.springframework.data.domain.Window<NotificationEntity> findByReceiverId(Long receiverId, org.springframework.data.domain.ScrollPosition position, org.springframework.data.domain.Limit limit, org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public long countByReceiverIdAndReadAtIsNull(Long receiverId) { throw new UnsupportedOperationException(); }
        @Override public int markAllReadByReceiverId(Long receiverId, java.time.LocalDateTime now) { throw new UnsupportedOperationException(); }
        @Override public List<NotificationEntity> findAll() { throw new UnsupportedOperationException(); }
        @Override public List<NotificationEntity> findAll(org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public org.springframework.data.domain.Page<NotificationEntity> findAll(org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public List<NotificationEntity> findAllById(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationEntity> List<S> saveAll(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public Optional<NotificationEntity> findById(Long id) { return store.stream().filter(it -> id.equals(it.getId())).findFirst(); }
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

    private static class FakeNotificationTypeRepository implements NotificationTypeRepository {
        private final List<NotificationTypeEntity> store = new ArrayList<>();
        private long sequence = 0;

        @Override
        public Optional<NotificationTypeEntity> findByCode(String code) {
            return store.stream().filter(it -> it.getCode().equals(code)).findFirst();
        }

        @Override
        public List<NotificationTypeEntity> findByCodeIn(java.util.Collection<String> codes) {
            return store.stream().filter(it -> codes.contains(it.getCode())).toList();
        }

        @Override
        public <S extends NotificationTypeEntity> S save(S entity) {
            if (entity.getId() == null) assignId(entity, ++sequence);
            store.add(entity);
            return entity;
        }

        @Override public List<NotificationTypeEntity> findAll() { throw new UnsupportedOperationException(); }
        @Override public List<NotificationTypeEntity> findAll(org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public org.springframework.data.domain.Page<NotificationTypeEntity> findAll(org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public List<NotificationTypeEntity> findAllById(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public <S extends NotificationTypeEntity> List<S> saveAll(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public Optional<NotificationTypeEntity> findById(Long id) { throw new UnsupportedOperationException(); }
        @Override public boolean existsById(Long id) { throw new UnsupportedOperationException(); }
        @Override public long count() { return store.size(); }
        @Override public void deleteById(Long id) { throw new UnsupportedOperationException(); }
        @Override public void delete(NotificationTypeEntity entity) { throw new UnsupportedOperationException(); }
        @Override public void deleteAll() { store.clear(); }
        @Override public void deleteAll(Iterable<? extends NotificationTypeEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) { throw new UnsupportedOperationException(); }
        @Override public void flush() { }
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

    private static class FakeDeviceTokenRepository implements DeviceTokenRepository {
        private final List<DeviceTokenEntity> store = new ArrayList<>();
        private long sequence = 0;

        @Override
        public List<DeviceTokenEntity> findByMemberIdAndEnabledTrue(Long memberId) {
            return store.stream().filter(it -> it.getMemberId().equals(memberId) && it.isEnabled()).toList();
        }

        @Override
        public <S extends DeviceTokenEntity> S save(S entity) {
            if (entity.getId() == null) {
                try {
                    var field = DeviceTokenEntity.class.getDeclaredField("id");
                    field.setAccessible(true);
                    field.set(entity, ++sequence);
                } catch (ReflectiveOperationException e) {
                    throw new IllegalStateException(e);
                }
            }
            store.add(entity);
            return entity;
        }

        @Override public Optional<DeviceTokenEntity> findByToken(String token) { throw new UnsupportedOperationException(); }
        @Override public Optional<DeviceTokenEntity> findByMemberIdAndToken(Long memberId, String token) { throw new UnsupportedOperationException(); }
        @Override public List<DeviceTokenEntity> findAll() { throw new UnsupportedOperationException(); }
        @Override public List<DeviceTokenEntity> findAll(org.springframework.data.domain.Sort sort) { throw new UnsupportedOperationException(); }
        @Override public org.springframework.data.domain.Page<DeviceTokenEntity> findAll(org.springframework.data.domain.Pageable pageable) { throw new UnsupportedOperationException(); }
        @Override public List<DeviceTokenEntity> findAllById(Iterable<Long> ids) { throw new UnsupportedOperationException(); }
        @Override public <S extends DeviceTokenEntity> List<S> saveAll(Iterable<S> entities) { throw new UnsupportedOperationException(); }
        @Override public Optional<DeviceTokenEntity> findById(Long id) { throw new UnsupportedOperationException(); }
        @Override public boolean existsById(Long id) { throw new UnsupportedOperationException(); }
        @Override public long count() { return store.size(); }
        @Override public void deleteById(Long id) { throw new UnsupportedOperationException(); }
        @Override public void delete(DeviceTokenEntity entity) { store.remove(entity); }
        @Override public void deleteAll() { store.clear(); }
        @Override public void deleteAll(Iterable<? extends DeviceTokenEntity> entities) { throw new UnsupportedOperationException(); }
        @Override public void deleteAllById(Iterable<? extends Long> ids) { throw new UnsupportedOperationException(); }
        @Override public void flush() { }
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
