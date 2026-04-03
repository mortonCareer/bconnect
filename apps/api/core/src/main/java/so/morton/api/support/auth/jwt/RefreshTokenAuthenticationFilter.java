package so.morton.api.support.auth.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.log.LogMessage;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import so.morton.api.support.auth.AuthenticationTypeMismatchException;

import java.io.IOException;

import static so.morton.api.support.auth.jwt.JwtUtils.resolveCookie;


/**
 * Resolve and validate refresh token
 */
@Component
public class RefreshTokenAuthenticationFilter extends OncePerRequestFilter {

    private final SecurityContextHolderStrategy securityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy();

    private final AuthenticationManager authenticationManager;

    private final RequestMatcher requiresAuthenticationRequestMatcher = PathPatternRequestMatcher.withDefaults()
            .matcher(HttpMethod.POST, "/api/v1/auth/refresh");

    private final AuthenticationSuccessHandler successHandler;

    private final AuthenticationFailureHandler failureHandler = new SimpleUrlAuthenticationFailureHandler();

    public RefreshTokenAuthenticationFilter(AuthenticationManager authenticationManager,
                                            @Qualifier("RefreshTokenAuthenticationSuccessHandler") AuthenticationSuccessHandler successHandler) {
        this.authenticationManager = authenticationManager;
        this.successHandler = successHandler;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,@NonNull HttpServletResponse response,@NonNull FilterChain filterChain) throws ServletException, IOException {

        if (!requiresAuthentication(request, response)) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = resolveCookie(request, "refreshToken");
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            JwtAuthenticationToken authRequest = new JwtAuthenticationToken(token);
            JwtAuthenticationToken authResult = (JwtAuthenticationToken) this.authenticationManager.authenticate(authRequest);

            if (!authResult.isRefreshToken()) {
                throw new AuthenticationTypeMismatchException("Only refresh token is supported");
            }

            SecurityContext context = this.securityContextHolderStrategy.createEmptyContext();
            context.setAuthentication(authResult);
            this.securityContextHolderStrategy.setContext(context);
            if (this.logger.isDebugEnabled()) {
                this.logger.debug(LogMessage.format("Set SecurityContextHolder to %s", authResult));
            }
            this.successHandler.onAuthenticationSuccess(request, response, authResult);
            // to of filter chain
        }
        catch (AuthenticationException failed) {
            this.securityContextHolderStrategy.clearContext();
            this.logger.trace("Failed to process authentication request", failed);
            this.failureHandler.onAuthenticationFailure(request, response, failed);
        }
    }

    protected boolean requiresAuthentication(HttpServletRequest request, HttpServletResponse response) {
        if (this.requiresAuthenticationRequestMatcher.matches(request)) {
            return true;
        }

        if (this.logger.isTraceEnabled()) {
            this.logger.trace("Did not match request to" + this.requiresAuthenticationRequestMatcher);
        }
        return false;
    }
}
