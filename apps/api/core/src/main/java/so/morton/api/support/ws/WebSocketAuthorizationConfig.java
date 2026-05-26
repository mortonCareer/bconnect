package so.morton.api.support.ws;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

@Configuration
@RequiredArgsConstructor
public class WebSocketAuthorizationConfig {
    public static final String CHAT_TOPIC_PREFIX = "/topic/chats/";

    private final ChatAuthorizationManager chatAuthorizationManager;

    @Bean
    AuthorizationManager<Message<?>> messageAuthorizationManager() {
        return MessageMatcherDelegatingAuthorizationManager.builder()
                .nullDestMatcher().permitAll()
                .simpSubscribeDestMatchers(CHAT_TOPIC_PREFIX + "{chatId}")
                .access(chatAuthorizationManager)
                .simpMessageDestMatchers("/app/chats/{chatId}/messages")
                .access(chatAuthorizationManager)
                .anyMessage().denyAll()
                .build();
    }
}
