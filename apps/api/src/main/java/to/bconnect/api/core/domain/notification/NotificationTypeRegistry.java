package to.bconnect.api.core.domain.notification;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.notification.NotificationReferenceType;
import to.bconnect.api.storage.notification.NotificationTypeEntity;
import to.bconnect.api.storage.notification.NotificationTypeRepository;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class NotificationTypeRegistry {

    private static final List<Seed> SEEDS = List.of(
            new Seed("CHAT_MESSAGE", NotificationReferenceType.CHAT_ROOM, "{sender}님이 메시지를 보냈습니다")
    );

    private record Seed(String code, NotificationReferenceType referenceType, String message) {}

    @Bean
    ApplicationRunner seedNotificationTypes(NotificationTypeRepository repository) {
        return args -> upsertAll(repository);
    }

    @Transactional
    public void upsertAll(NotificationTypeRepository repository) {
        for (Seed seed : SEEDS) {
            repository.findByCode(seed.code()).ifPresentOrElse(
                    existing -> {
                        existing.update(seed.referenceType(), seed.message());
                        repository.save(existing);
                    },
                    () -> repository.save(new NotificationTypeEntity(seed.code(), seed.referenceType(), seed.message()))
            );
        }
    }
}
