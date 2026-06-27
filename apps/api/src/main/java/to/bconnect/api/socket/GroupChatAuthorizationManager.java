package to.bconnect.api.socket;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.messaging.access.intercept.MessageAuthorizationContext;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.chat.ParticipantRepository;
import to.bconnect.api.security.AuthUser;

import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class GroupChatAuthorizationManager
        implements AuthorizationManager<MessageAuthorizationContext<?>> {

    private final ParticipantRepository participantRepository;

    @Override
    public AuthorizationDecision authorize(
            Supplier<? extends Authentication> authentication,
            MessageAuthorizationContext<?> context) {
        val auth = authentication.get();
        if (auth == null || !auth.isAuthenticated())
            return new AuthorizationDecision(false);
        if (!(auth.getPrincipal() instanceof AuthUser user))
            return new AuthorizationDecision(false);

        try {
            val chatId = Long.parseLong(context.getVariables().get("chatId"));
            val granted = participantRepository.existsByChatIdAndMemberId(chatId, user.id());
            return new AuthorizationDecision(granted);
        } catch (NumberFormatException e) {
            return new AuthorizationDecision(false);
        }
    }
}
