package to.bconnect.api.socket;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import to.bconnect.api.security.AuthExceptionCode;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.jwt.JwtAuthenticationToken;
import to.bconnect.api.security.jwt.JwtProvider;
import to.bconnect.api.security.jwt.JwtType;
import to.bconnect.api.security.jwt.JwtUtils;

/**
 * @see <a href="https://docs.spring.io/spring-framework/reference/web/websocket/stomp/authentication-token-based.html">Token Authentication</a>
 */
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtProvider jwtProvider;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(@NotNull Message<?> message, @NotNull MessageChannel channel) {
        val accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;
        if (StompCommand.CONNECT.equals(accessor.getCommand()))
            authenticate(accessor);

        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        val authorization = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
        val token = JwtUtils.resolveBearerToken(authorization);
        if (token == null)
            throw new CodeException(AuthExceptionCode.INVALID_JWT_TOKEN);

        try {
            jwtProvider.validateToken(token);
        } catch (ExpiredJwtException e) {
            throw new CodeException(AuthExceptionCode.EXPIRED_JWT_TOKEN);
        } catch (JwtException e) {
            throw new CodeException(AuthExceptionCode.INVALID_JWT_TOKEN);
        }

        if (!jwtProvider.isAccessToken(token))
            throw new CodeException(AuthExceptionCode.INVALID_JWT_TOKEN);

        val username = jwtProvider.getUsername(token);
        val user = userDetailsService.loadUserByUsername(username);

        val auth = new JwtAuthenticationToken(user, token, JwtType.ACCESS, user.getAuthorities());
        accessor.setUser(auth);
    }
}
