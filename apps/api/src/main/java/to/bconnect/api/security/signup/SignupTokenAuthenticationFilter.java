package to.bconnect.api.security.signup;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.val;
import org.springframework.core.log.LogMessage;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;


/**
 * Resolve and validate signup token
 */
@Component
public class SignupTokenAuthenticationFilter extends OncePerRequestFilter {

    private static final String SIGNUP_TOKEN_HEADER = "X-Signup-Token";

    private final SecurityContextHolderStrategy securityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy();

    private final AuthenticationManager authenticationManager;

    private final RequestMatcher requiresAuthenticationRequestMatcher = PathPatternRequestMatcher.withDefaults()
            .matcher(HttpMethod.POST, "/api/v1/members");

    private final AuthenticationFailureHandler failureHandler = new SimpleUrlAuthenticationFailureHandler();

    public SignupTokenAuthenticationFilter(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,@NonNull HttpServletResponse response,@NonNull FilterChain filterChain) throws ServletException, IOException {

        if (!requiresAuthentication(request, response)) {
            filterChain.doFilter(request, response);
            return;
        }

        val token = request.getHeader(SIGNUP_TOKEN_HEADER);
        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            val authRequest = new SignupTokenAuthenticationToken(token);
            val authResult = this.authenticationManager.authenticate(authRequest);

            val context = this.securityContextHolderStrategy.createEmptyContext();
            context.setAuthentication(authResult);
            this.securityContextHolderStrategy.setContext(context);
            if (this.logger.isDebugEnabled()) {
                this.logger.debug(LogMessage.format("Set SecurityContextHolder to %s", authResult));
            }
            filterChain.doFilter(request, response);
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
