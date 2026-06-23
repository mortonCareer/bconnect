package to.bconnect.api.storage.attachment;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AttachmentType {
    IMAGE("images"),
    FILE("files");

    private final String path;
}
