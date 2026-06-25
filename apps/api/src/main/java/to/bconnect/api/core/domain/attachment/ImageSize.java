package to.bconnect.api.core.domain.attachment;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ImageSize {
    ORIGINAL("o", null),
    MEDIUM("m", "webp"),
    SMALL("s", "webp");

    private final String path;
    private final String extension;
}
