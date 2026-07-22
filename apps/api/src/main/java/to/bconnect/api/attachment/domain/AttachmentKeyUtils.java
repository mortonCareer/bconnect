package to.bconnect.api.attachment.domain;

import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.util.Arrays;
import java.util.List;

/**
 * key rule : {scope}/{type}/{size}/{uuid}.{ext} (size segment for IMAGE only)
 * scope : {context}/{contextId}
 */
public final class AttachmentKeyUtils {

    private static final String DELIMITER = "/";

    public static String scope(AttachmentContext context) {
        return context.getPath();
    }

    public static String scope(AttachmentContext context, Long contextId) {
        return join(context.getPath(), contextId.toString());
    }

    public static List<String> allKeys(AttachmentContext context, Long contextId, AttachmentType type, String uuid, String ext) {
        if (type != AttachmentType.IMAGE)
            return List.of(key(context, contextId, type, ImageSize.ORIGINAL, uuid, ext));

        return Arrays.stream(ImageSize.values())
                .map(size -> key(context, contextId, type, size, uuid,
                        size == ImageSize.ORIGINAL ? ext : size.getExtension()))
                .toList();
    }

    public static String key(AttachmentContext context, Long contextId, AttachmentType type, ImageSize size, String uuid, String ext) {
        if (type == AttachmentType.IMAGE)
            return join(context.getPath(), contextId.toString(), type.getPath(), size.getPath(), filename(uuid, ext));
        return join(context.getPath(), contextId.toString(), type.getPath(), filename(uuid, ext));
    }

    private static String filename(String uuid, String ext) {
        return uuid + "." + ext;
    }

    private static String join(String... segments) {
        return String.join(DELIMITER, segments);
    }
}
