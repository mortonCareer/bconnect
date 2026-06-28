package to.bconnect.api.storage;

import to.bconnect.api.storage.attachment.AttachmentContext;

import java.util.Collection;
import java.util.Set;

public interface AttachmentReferenceProvider {

    AttachmentContext context();

    Set<Long> referencedIds(Collection<Long> attachmentIds);
}
