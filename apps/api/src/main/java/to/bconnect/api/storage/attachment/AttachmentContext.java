package to.bconnect.api.storage.attachment;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AttachmentContext {
    CHAT("chats"),
    COMPANY("companies"),
    CREDENTIAL("credentials"),
    DRIVE("drives"),
    MEMBER("members"),
    POST("posts");

    private final String path;
}
