package to.bconnect.api.socket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

@Configuration
@RequiredArgsConstructor
public class WebSocketAuthorizationConfig {
    public static final String GROUP_CHAT_TOPIC_PREFIX = "/topic/group-chats/";
    public static final String DIRECT_CHAT_TOPIC_PREFIX = "/topic/direct-chats/";

    private final GroupChatAuthorizationManager groupChatAuthorizationManager;
    private final DirectChatAuthorizationManager directChatAuthorizationManager;

    @Bean
    AuthorizationManager<Message<?>> messageAuthorizationManager() {
        return MessageMatcherDelegatingAuthorizationManager.builder()
                .nullDestMatcher().permitAll()
                .simpSubscribeDestMatchers(GROUP_CHAT_TOPIC_PREFIX + "{chatId}")
                .access(groupChatAuthorizationManager)
                .simpMessageDestMatchers("/app/group-chats/{chatId}/messages")
                .access(groupChatAuthorizationManager)
                .simpSubscribeDestMatchers(DIRECT_CHAT_TOPIC_PREFIX + "{chatId}")
                .access(directChatAuthorizationManager)
                .simpMessageDestMatchers("/app/direct-chats/{chatId}/messages")
                .access(directChatAuthorizationManager)
                .anyMessage().denyAll()
                .build();
    }
}
