package to.bconnect.api.attachment.domain;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

public interface FileStorage {

    String presign(String key, String contentType, Duration ttl);

    Optional<ObjectHead> head(String key);

    void delete(String key);

    void deleteAll(List<String> keys);
}
