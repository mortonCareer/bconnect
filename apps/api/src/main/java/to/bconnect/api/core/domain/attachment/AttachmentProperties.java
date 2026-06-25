package to.bconnect.api.core.domain.attachment;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.List;

@Validated
@ConfigurationProperties(prefix = "app.attachment")
public record AttachmentProperties(
    @NotNull(message = "app.attachment.max-file-size must not be null")
    DataSize maxFileSize,
    @Positive(message = "app.attachment.max-batch-size must be positive")
    int maxBatchSize,
    @NotNull(message = "app.attachment.presign-ttl must not be null")
    Duration presignTtl,
    @NotEmpty(message = "app.attachment.allowed-content-types must not be empty")
    List<String> allowedContentTypes
) {}
