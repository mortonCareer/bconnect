package to.bconnect.api.attachment.infrastructure.s3;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import to.bconnect.api.attachment.domain.FileStorage;
import to.bconnect.api.attachment.domain.ObjectHead;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@Profile({"local", "test"})
public class LoggingFileStorage implements FileStorage {

    private static final String BASE_URL = "http://localhost";

    @Override
    public String presign(String key, String contentType, Duration ttl) {
        log.info("Presign skipped. key={}, contentType={}, ttl={}", key, contentType, ttl);
        return BASE_URL + "/" + key;
    }

    @Override
    public Optional<ObjectHead> head(String key) {
        log.info("Head skipped. key={}", key);
        return Optional.empty();
    }

    @Override
    public void delete(String key) {
        log.info("Delete skipped. key={}", key);
    }

    @Override
    public void deleteAll(List<String> keys) {
        log.info("Delete skipped. keys={}", keys.size());
    }
}
