package to.bconnect.api.storage.attachment;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AttachmentContext {
    CHAT("chats"),
    CREDENTIAL("credentials"),
    POST("posts");

    private final String path;
}
