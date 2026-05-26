package so.morton.api.support.ws;

import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.NotNull;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import so.morton.api.support.AuthExceptionCode;
import so.morton.api.support.CodeException;
import so.morton.api.support.auth.jwt.JwtAuthenticationToken;
import so.morton.api.support.auth.jwt.JwtProvider;
import so.morton.api.support.auth.jwt.JwtType;
import so.morton.api.support.auth.jwt.JwtUtils;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtProvider jwtProvider;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(@NotNull Message<?> message, @NotNull MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;
        if (StompCommand.CONNECT.equals(accessor.getCommand()))
            authenticate(accessor);

        return message;
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String authorization = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
        String token = JwtUtils.resolveBearerToken(authorization);
        if (token == null)
            throw new CodeException(AuthExceptionCode.INVALID_ACCESS_TOKEN);

        try {
            jwtProvider.validateToken(token);
        } catch (JwtException e) {
            throw new CodeException(AuthExceptionCode.INVALID_ACCESS_TOKEN);
        }

        if (!jwtProvider.isAccessToken(token))
            throw new CodeException(AuthExceptionCode.INVALID_ACCESS_TOKEN);

        String username = jwtProvider.getUsername(token);
        UserDetails user = userDetailsService.loadUserByUsername(username);

        JwtAuthenticationToken auth = new JwtAuthenticationToken(user, token, JwtType.ACCESS, user.getAuthorities());
        accessor.setUser(auth);
    }
}
