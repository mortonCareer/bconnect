package to.bconnect.api.socket;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import to.bconnect.api.ApiConfigProps;

/**
 * @see <a href="https://docs.spring.io/spring-framework/reference/web/websocket/stomp/enable.html">Enable STOMP</a>
 * @see <a href="https://docs.spring.io/spring-framework/reference/web/websocket/stomp/authentication-token-based.html">Token Authentication</a>
 * @see <a href="https://docs.spring.io/spring-framework/reference/web/websocket/server.html#websocket-server-allowed-origins">Allowed Origins</a>
 */
@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final ApiConfigProps apiConfigProps;
    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        ApiConfigProps.Cors cors = apiConfigProps.cors();
        registry.addEndpoint("/ws")
                .setAllowedOrigins(cors.allowedOrigins().toArray(new String[0]))
                .setAllowedOriginPatterns(cors.allowedOriginPatterns().toArray(new String[0]));
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }
}
