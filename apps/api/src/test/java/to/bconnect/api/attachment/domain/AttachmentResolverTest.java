package to.bconnect.api.attachment.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.attachment.infrastructure.cloudfront.CloudFrontProperties;
import to.bconnect.api.attachment.infrastructure.cloudfront.CloudFrontUrlResolver;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentStatus;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.time.Duration;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class AttachmentResolverTest {

    private final CloudFrontUrlResolver urlResolver = new CloudFrontUrlResolver(
            new CloudFrontProperties("cdn.test", "kp", "pk", ".test", Duration.ofMinutes(5)));
    private final AttachmentResolver resolver = new AttachmentResolver(null, urlResolver);

    private Attachment attachment(AttachmentType type, String ext) {
        return new Attachment(1L, 1L, type, AttachmentStatus.COMPLETED,
                AttachmentContext.POST, 200L, ReferenceType.POST, 200L,
                "uuid-1", "photo", ext, "image/jpeg", 1024L,
                Instant.now(), Instant.now());
    }

    @Test
    @DisplayName("이미지 원본(o) URL 은 업로드 원본 확장자를 사용한다")
    void originalImage_usesOriginalExt() {
        String url = resolver.parseUrl(attachment(AttachmentType.IMAGE, "jpg"), ImageSize.ORIGINAL);

        assertThat(url).isEqualTo("https://cdn.test/posts/200/images/o/uuid-1.jpg");
    }

    @Test
    @DisplayName("이미지 축소본(m/s) URL 은 리사이즈 산출물 확장자(webp)를 사용한다 — allKeys 와 동일 규칙")
    void resizedImage_usesVariantExt() {
        String medium = resolver.parseUrl(attachment(AttachmentType.IMAGE, "jpg"), ImageSize.MEDIUM);
        String small = resolver.parseUrl(attachment(AttachmentType.IMAGE, "png"), ImageSize.SMALL);

        assertThat(medium).isEqualTo("https://cdn.test/posts/200/images/m/uuid-1.webp");
        assertThat(small).isEqualTo("https://cdn.test/posts/200/images/s/uuid-1.webp");
    }

    @Test
    @DisplayName("이미지가 아닌 파일은 사이즈와 무관하게 원본 확장자를 유지한다")
    void nonImage_keepsOriginalExt() {
        String url = resolver.parseUrl(attachment(AttachmentType.FILE, "pdf"), ImageSize.SMALL);

        assertThat(url).isEqualTo("https://cdn.test/posts/200/files/uuid-1.pdf");
    }
}
