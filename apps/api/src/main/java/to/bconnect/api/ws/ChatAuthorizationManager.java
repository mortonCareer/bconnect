package to.bconnect.api.ws;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.core.Authentication;
import org.springframework.security.messaging.access.intercept.MessageAuthorizationContext;
import org.springframework.stereotype.Component;
import to.bconnect.api.core.storage.chat.ParticipantRepository;
import to.bconnect.api.security.AuthUser;

import java.util.function.Supplier;

@Component
@RequiredArgsConstructor
public class ChatAuthorizationManager
        implements AuthorizationManager<MessageAuthorizationContext<?>> {

    private final ParticipantRepository participantRepository;

    @Override
    public AuthorizationDecision authorize(
            Supplier<? extends Authentication> authentication,
            MessageAuthorizationContext<?> context) {
        Authentication auth = authentication.get();
        if (auth == null || !auth.isAuthenticated())
            return new AuthorizationDecision(false);
        if (!(auth.getPrincipal() instanceof AuthUser authUser))
            return new AuthorizationDecision(false);

        Long chatId = Long.parseLong(context.getVariables().get("chatId"));
        try {
            boolean granted = participantRepository.existsByChatIdAndMemberId(chatId, authUser.id());
            return new AuthorizationDecision(granted);
        } catch (NumberFormatException e) {
            return new AuthorizationDecision(false);
        }
    }
}
