package to.bconnect.api.socket;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.handler.invocation.HandlerMethodArgumentResolver;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.authorization.SpringAuthorizationEventPublisher;
import org.springframework.security.messaging.access.intercept.AuthorizationChannelInterceptor;
import org.springframework.security.messaging.context.AuthenticationPrincipalArgumentResolver;
import org.springframework.security.messaging.context.SecurityContextChannelInterceptor;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

/**
 * 인바운드 인터셉터 순서 : WebSocketAuthInterceptor → SecurityContextChannelInterceptor → AuthorizationChannelInterceptor → ChatReadInterceptor
 * CSRF 비활성화를 위해 {@code @EnableWebSocketSecurity} 미사용
 * @see <a href="https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html">WebSocket Security</a>
 */
@Configuration
@RequiredArgsConstructor
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    public static final String GROUP_CHAT_TOPIC_PREFIX = "/topic/group-chats/";
    public static final String GROUP_CHAT_APP_PREFIX = "/app/group-chats/";
    public static final String DIRECT_CHAT_TOPIC_PREFIX = "/topic/direct-chats/";
    public static final String DIRECT_CHAT_APP_PREFIX = "/app/direct-chats/";

    private final ApplicationContext applicationContext;
    private final AuthorizationManager<Message<?>> authorizationManager;
    private final ChatReadInterceptor chatReadInterceptor;

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new AuthenticationPrincipalArgumentResolver());
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        val authz = new AuthorizationChannelInterceptor(authorizationManager);
        val publisher = new SpringAuthorizationEventPublisher(applicationContext);
        authz.setAuthorizationEventPublisher(publisher);
        registration.interceptors(new SecurityContextChannelInterceptor(), authz, chatReadInterceptor);
    }
}
