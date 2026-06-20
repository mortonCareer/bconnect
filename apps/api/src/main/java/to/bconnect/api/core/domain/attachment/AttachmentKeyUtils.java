package to.bconnect.api.core.domain.attachment;

import to.bconnect.api.storage.attachment.AttachmentEntity;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.util.Arrays;
import java.util.List;

/**
 * key rule : {context}/{contextId}/{type-and-size}/{uuid}.{ext}
 */
public final class AttachmentKeyUtils {

    private static final String DELIMITER = "/";

    private AttachmentKeyUtils() {}

    public static String key(AttachmentEntity attachment) {
        return key(attachment, ImageSize.ORIGINAL);
    }

    private static String key(AttachmentEntity attachment, ImageSize size) {
        String result;

        if(attachment.getType().equals(AttachmentType.IMAGE)) {
            String filename = attachment.getUuid()
                    + "."
                    + (size == ImageSize.ORIGINAL ? attachment.extensionOf() : size.getExtension());

            result = String.join(
                    DELIMITER,
                    attachment.getContext().getPath(),
                    attachment.getContextId().toString(),
                    attachment.getType().getPath(),
                    size.getPath(),
                    filename
            );
        } else {
            result = String.join(
                    DELIMITER,
                    attachment.getContext().getPath(),
                    attachment.getContextId().toString(),
                    attachment.getType().getPath(),
                    attachment.getUuid() + "." + attachment.extensionOf()
            );
        }
        return result;
    }

    public static String key(Attachment attachment) {
        return key(attachment, ImageSize.ORIGINAL);
    }

    public static String key(Attachment attachment, ImageSize size) {
        String result;

        if (attachment.type().equals(AttachmentType.IMAGE)) {
            String filename = attachment.uuid()
                    + "."
                    + (size == ImageSize.ORIGINAL ? attachment.extension() : size.getExtension());

            result = String.join(
                    DELIMITER,
                    attachment.context().getPath(),
                    attachment.contextId().toString(),
                    attachment.type().getPath(),
                    size.getPath(),
                    filename
            );
        } else {
            result = String.join(
                    DELIMITER,
                    attachment.context().getPath(),
                    attachment.contextId().toString(),
                    attachment.type().getPath(),
                    attachment.uuid() + "." + attachment.extension()
            );
        }
        return result;
    }

    public static List<String> allKeys(AttachmentEntity attachment) {
        List<String> result;

        if (attachment.getType().equals(AttachmentType.IMAGE)) {
            result = List.of(key(attachment));
        } else {
            result = Arrays.stream(ImageSize.values())
                    .map(it -> key(attachment, it))
                    .toList();
        }
        return result;
    }
}
