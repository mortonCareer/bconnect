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

    private final GroupChatAuthorizationManager groupChatAuthorizationManager;
    private final DirectChatAuthorizationManager directChatAuthorizationManager;

    @Bean
    AuthorizationManager<Message<?>> messageAuthorizationManager() {
        return MessageMatcherDelegatingAuthorizationManager.builder()
                .nullDestMatcher().permitAll()
                .simpSubscribeDestMatchers(WebSocketSecurityConfig.GROUP_CHAT_TOPIC_PREFIX + "{chatId}")
                .access(groupChatAuthorizationManager)
                .simpMessageDestMatchers(WebSocketSecurityConfig.GROUP_CHAT_APP_PREFIX + "{chatId}/messages")
                .access(groupChatAuthorizationManager)
                .simpSubscribeDestMatchers(WebSocketSecurityConfig.DIRECT_CHAT_TOPIC_PREFIX + "{chatId}")
                .access(directChatAuthorizationManager)
                .simpMessageDestMatchers(WebSocketSecurityConfig.DIRECT_CHAT_APP_PREFIX + "{chatId}/messages")
                .access(directChatAuthorizationManager)
                .anyMessage().denyAll()
                .build();
    }
}
