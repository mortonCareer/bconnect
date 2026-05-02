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

    private final ChatAuthorizationManager chatAuthorizationManager;

    @Bean
    AuthorizationManager<Message<?>> messageAuthorizationManager() {
        return MessageMatcherDelegatingAuthorizationManager.builder()
                .nullDestMatcher().permitAll()
                .simpSubscribeDestMatchers("/topic/chats/{chatId}")
                    .access(chatAuthorizationManager)
                .simpDestMatchers("/app/**").authenticated()
                .simpDestMatchers("/topic/**", "/queue/**").denyAll()
                .anyMessage().denyAll()
                .build();
    }
}
