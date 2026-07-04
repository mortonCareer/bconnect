package to.bconnect.api.attachment.domain.cleanup;

import lombok.val;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.attachment.AttachmentContext;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class AttachmentContextValidatorRegistry {

    private final Map<AttachmentContext, AttachmentContextValidator> validators;

    public AttachmentContextValidatorRegistry(List<AttachmentContextValidator> validators) {
        this.validators = validators.stream()
                .collect(Collectors.toUnmodifiableMap(AttachmentContextValidator::context, Function.identity()));
        for (val context : AttachmentContext.values()) {
            if (!this.validators.containsKey(context))
                throw new IllegalStateException("AttachmentContextValidator 미등록 context: " + context);
        }
    }

    public void validate(Long memberId, AttachmentContext context, Long contextId) {
        validators.get(context).validate(memberId, contextId);
    }
}
