package to.bconnect.api.security.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import static lombok.AccessLevel.PROTECTED;
import static to.bconnect.api.security.jwt.JwtUtils.resolveBearerToken;

/**
 * Resolve and validate access token
 */
@Component
@RequiredArgsConstructor(access = PROTECTED)
public class AccessTokenAuthenticationFilter extends OncePerRequestFilter {

    private final SecurityContextHolderStrategy securityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy();

    private final AuthenticationManager authenticationManager;

    private final AuthenticationFailureHandler failureHandler = new SimpleUrlAuthenticationFailureHandler();

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,@NonNull HttpServletResponse response,@NonNull FilterChain filterChain) throws ServletException, IOException {
        String token = resolveBearerToken(request);
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            JwtAuthenticationToken authRequest = new JwtAuthenticationToken(token);
            JwtAuthenticationToken authResult = (JwtAuthenticationToken) this.authenticationManager.authenticate(authRequest);

            if (authResult.isAccessToken()) {
                SecurityContext context = this.securityContextHolderStrategy.createEmptyContext();
                context.setAuthentication(authResult);
                this.securityContextHolderStrategy.setContext(context);
                if (this.logger.isDebugEnabled()) {
                    this.logger.debug("Set SecurityContextHolder to" + authResult);
                }
            }

            filterChain.doFilter(request, response);
        }
        catch (AuthenticationException failed) {
            this.securityContextHolderStrategy.clearContext();
            if (this.logger.isTraceEnabled()) {
                this.logger.trace("Failed to process authentication request", failed);
            }
            this.failureHandler.onAuthenticationFailure(request, response, failed);
        }
    }

}
