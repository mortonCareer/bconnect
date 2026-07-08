package to.bconnect.api.notification.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.notification.NotificationArgs;
import to.bconnect.api.core.domain.notification.NotificationLinker;
import to.bconnect.api.notification.domain.push.PushEndpointRegistry;
import to.bconnect.api.notification.domain.push.PushPayload;
import to.bconnect.api.notification.domain.push.PushSendResult;
import to.bconnect.api.notification.domain.push.PushSender;
import to.bconnect.api.notification.domain.target.ChatMessageTargetResolver;
import to.bconnect.api.notification.domain.target.NotificationTargetResolverRegistry;
import to.bconnect.api.socket.message.ChatMessageSentEvent;
import to.bconnect.api.storage.device.DevicePlatform;
import to.bconnect.api.storage.device.DeviceTokenEntity;
import to.bconnect.api.storage.device.DeviceTokenRepository;
import to.bconnect.api.storage.notification.NotificationEntity;
import to.bconnect.api.storage.notification.NotificationRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationServiceTest {

    private static final Long SENDER = 1L;
    private static final Long CHAT_ID = 50L;

    private NotificationService service(NotificationRepository notificationRepository,
                                        DeviceTokenRepository deviceRepository,
                                        MemberResolver memberResolver,
                                        CapturingPushSender pushSender) {
        var linker = new NotificationLinker(notificationRepository);
        var deviceService = new DeviceService(deviceRepository, new NoopEndpointRegistry());
        var messageFactory = new NotificationMessageFactory(memberResolver);
        var registry = new NotificationTargetResolverRegistry(List.of(new ChatMessageTargetResolver()));
        return new NotificationService(registry, linker, deviceService, messageFactory, pushSender);
    }

    private void handleChat(NotificationService service, List<Long> recipientIds, Set<Long> activeMemberIds, String preview) {
        service.handle(NotificationType.CHAT_MESSAGE,
                new ChatMessageSentEvent(SENDER, CHAT_ID, recipientIds, activeMemberIds, preview));
    }

    private MemberResolver resolverReturning(String name) {
        return new MemberResolver(null) {
            @Override
            public Member find(Long memberId) {
                return new Member(memberId, "u" + memberId, name, "010", null, null, null);
            }
        };
    }

    @Test
    @DisplayName("DB 알림은 활성/비활성 구분 없이 (참여자 전원)에게 저장된다 — 활성 사용자도 히스토리 보존")
    void handle_savesRowForEveryRecipient() {
        var notiRepo = new FakeNotificationRepository();
        var service = service(notiRepo, new FakeDeviceTokenRepository(), resolverReturning("n"), new CapturingPushSender());

        handleChat(service, List.of(10L, 11L, 12L), Set.of(11L), "안녕");

        assertThat(notiRepo.store).hasSize(3);
        assertThat(notiRepo.store).extracting(NotificationEntity::getReceiverId)
                .containsExactlyInAnyOrder(10L, 11L, 12L);
        assertThat(notiRepo.store).allSatisfy(n -> {
            assertThat(n.getTypeCode()).isEqualTo("CHAT_MESSAGE");
            assertThat(n.getReferenceId()).isEqualTo(CHAT_ID);
            assertThat(n.getContent()).isEqualTo("안녕");
            assertThat(n.getSenderId()).isEqualTo(SENDER);
        });
    }

    @Test
    @DisplayName("푸시 대상은 활성 사용자를 제외한 비활성 수신자뿐이다")
    void handle_pushTargetsExcludeActive() {
        var deviceRepo = new FakeDeviceTokenRepository();
        deviceRepo.save(new DeviceTokenEntity(10L, "t10", DevicePlatform.web, "arn:10"));
        deviceRepo.save(new DeviceTokenEntity(11L, "t11", DevicePlatform.web, "arn:11"));
        deviceRepo.save(new DeviceTokenEntity(12L, "t12", DevicePlatform.web, "arn:12"));
        var sender = new CapturingPushSender();
        var service = service(new FakeNotificationRepository(), deviceRepo, resolverReturning("n"), sender);

        handleChat(service, List.of(10L, 11L, 12L), Set.of(11L), "안녕");

        assertThat(sender.sent).extracting(CapturingPushSender.Sent::endpointArn)
                .containsExactlyInAnyOrder("arn:10", "arn:12");
    }

    @Test
    @DisplayName("수신자가 없으면 저장도 발송도 없다")
    void handle_emptyRecipients_noop() {
        var notiRepo = new FakeNotificationRepository();
        var sender = new CapturingPushSender();
        var service = service(notiRepo, new FakeDeviceTokenRepository(), resolverReturning("n"), sender);

        handleChat(service, List.of(), Set.of(), "안녕");

        assertThat(notiRepo.store).isEmpty();
        assertThat(sender.sent).isEmpty();
    }

    @Test
    @DisplayName("수신자가 전부 활성이면 DB 는 저장하되 푸시는 발송하지 않는다")
    void handle_allActive_savesButNoPush() {
        var notiRepo = new FakeNotificationRepository();
        var deviceRepo = new FakeDeviceTokenRepository();
        deviceRepo.save(new DeviceTokenEntity(10L, "t10", DevicePlatform.web, "arn:10"));
        var sender = new CapturingPushSender();
        var service = service(notiRepo, deviceRepo, resolverReturning("n"), sender);

        handleChat(service, List.of(10L), Set.of(10L), "안녕");

        assertThat(notiRepo.store).hasSize(1);
        assertThat(sender.sent).isEmpty();
    }

    @Test
    @DisplayName("발송 시 타입 enum 이 현재 이름으로 렌더하고, 대상의 활성 디바이스 endpoint 로만 link 를 보낸다")
    void handle_rendersSenderAndSendsToEnabledDevices() {
        var notiRepo = new FakeNotificationRepository();
        var deviceRepo = new FakeDeviceTokenRepository();
        deviceRepo.save(new DeviceTokenEntity(10L, "tok-10", DevicePlatform.web, "arn:device:10"));
        var sender = new CapturingPushSender();
        var service = service(notiRepo, deviceRepo, resolverReturning("홍길동"), sender);

        handleChat(service, List.of(10L), Set.of(), "안녕하세요");

        String notificationId = String.valueOf(notiRepo.store.getFirst().getId());
        assertThat(sender.sent).hasSize(1);
        assertThat(NotificationArgs.fromJson(notiRepo.store.getFirst().getTemplateArgs())
                .get(NotificationArgs.SENDER_NAME)).isEqualTo("홍길동");
        var sent = sender.sent.getFirst();
        assertThat(sent.endpointArn()).isEqualTo("arn:device:10");
        assertThat(sent.payload().title()).isEqualTo("홍길동님이 메시지를 보냈습니다");
        assertThat(sent.payload().body()).isEqualTo("안녕하세요");
        assertThat(sent.payload().link()).isEqualTo("/n/chat_room/" + CHAT_ID);
        assertThat(sent.payload().data())
                .containsEntry("notification_id", notificationId)
                .containsEntry("type_code", "CHAT_MESSAGE")
                .containsEntry("reference_type", "chat_room")
                .containsEntry("reference_id", String.valueOf(CHAT_ID));
    }

    @Test
    @DisplayName("비활성(enabled=false) 디바이스에는 발송하지 않는다")
    void handle_skipsDisabledDevices() {
        var deviceRepo = new FakeDeviceTokenRepository();
        var disabled = deviceRepo.save(new DeviceTokenEntity(10L, "tok-10", DevicePlatform.web, "arn:device:10"));
        disabled.disable();
        var sender = new CapturingPushSender();
        var service = service(new FakeNotificationRepository(), deviceRepo, resolverReturning("n"), sender);

        handleChat(service, List.of(10L), Set.of(), "안녕");

        assertThat(sender.sent).isEmpty();
    }

    @Test
    @DisplayName("발송 결과가 EXPIRED 면 해당 디바이스가 비활성화된다")
    void handle_disablesExpiredEndpoint() {
        var deviceRepo = new FakeDeviceTokenRepository();
        var device = deviceRepo.save(new DeviceTokenEntity(10L, "tok-10", DevicePlatform.web, "arn:device:10"));
        var sender = new CapturingPushSender();
        sender.statusToReturn = PushSendResult.Status.EXPIRED;
        var service = service(new FakeNotificationRepository(), deviceRepo, resolverReturning("n"), sender);

        handleChat(service, List.of(10L), Set.of(), "안녕");

        assertThat(device.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("발송 결과가 FAILED(일시 실패) 면 디바이스를 비활성화하지 않는다")
    void handle_keepsDeviceOnTransientFailure() {
        var deviceRepo = new FakeDeviceTokenRepository();
        var device = deviceRepo.save(new DeviceTokenEntity(10L, "tok-10", DevicePlatform.web, "arn:device:10"));
        var sender = new CapturingPushSender();
        sender.statusToReturn = PushSendResult.Status.FAILED;
        var service = service(new FakeNotificationRepository(), deviceRepo, resolverReturning("n"), sender);

        handleChat(service, List.of(10L), Set.of(), "안녕");

        assertThat(device.isEnabled()).isTrue();
    }

    private static class NoopEndpointRegistry implements PushEndpointRegistry {
        @Override
        public String ensureEndpoint(String token) {
            return "arn:" + token;
        }

        @Override
        public void deleteEndpoint(String endpointArn) {
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
