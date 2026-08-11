package to.bconnect.api.security;

import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.cors.CorsConfiguration;
import to.bconnect.api.ApiConfigProps;
import to.bconnect.api.security.jwt.AccessTokenAuthenticationFilter;
import to.bconnect.api.security.jwt.JwtAuthenticationProvider;
import to.bconnect.api.security.jwt.JwtProvider;
import to.bconnect.api.security.jwt.RefreshTokenAuthenticationFilter;
import to.bconnect.api.security.otp.OtpAuthenticationProvider;
import to.bconnect.api.security.otp.OtpService;
import to.bconnect.api.security.otp.VerifyOtpAuthenticationFilter;
import to.bconnect.api.security.session.SessionService;
import to.bconnect.api.security.signup.SignupTokenAuthenticationFilter;
import to.bconnect.api.security.signup.SignupTokenAuthenticationProvider;
import to.bconnect.api.security.signup.SignupTokenService;
import tools.jackson.databind.ObjectMapper;

import java.util.Collections;

import static org.springframework.http.HttpMethod.*;
import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final ApiConfigProps apiConfigProps;

    @Bean
    public AuthenticationManager authenticationManager(
            AuthUserService authUserService,
            JwtProvider jwtProvider,
            OtpService otpService,
            SignupTokenService signupTokenService,
            SessionService sessionService) {

        val jwtAuthenticationProvider = new JwtAuthenticationProvider(authUserService, sessionService, jwtProvider);
        val otpAuthenticationProvider = new OtpAuthenticationProvider(otpService, authUserService);
        val signupTokenAuthenticationProvider = new SignupTokenAuthenticationProvider(signupTokenService);
        return new ProviderManager(jwtAuthenticationProvider, otpAuthenticationProvider, signupTokenAuthenticationProvider);
    }

    @Bean
    SecurityFilterChain defaultSecurityFilterChain(
            HttpSecurity http,
            AuthenticationManager authenticationManager,
            ObjectMapper objectMapper,
            AccessTokenAuthenticationFilter accessTokenAuthenticationFilter,
            RefreshTokenAuthenticationFilter refreshTokenAuthenticationFilter,
            SignupTokenAuthenticationFilter signupTokenAuthenticationFilter,
            @Qualifier("VerifyOtpAuthenticationSuccessHandler") AuthenticationSuccessHandler verifyOtpSuccessHandler,
            AuthenticationFailureHandler apiAuthenticationFailureHandler,
            AuthenticationEntryPoint apiAuthenticationEntryPoint,
            AccessDeniedHandler apiAccessDeniedHandler
    ) throws Exception {
        val verifyOtpFilter = new VerifyOtpAuthenticationFilter(authenticationManager, objectMapper);
        verifyOtpFilter.setAuthenticationSuccessHandler(verifyOtpSuccessHandler);
        verifyOtpFilter.setAuthenticationFailureHandler(apiAuthenticationFailureHandler);

        http
                .sessionManagement(sc -> sc.sessionCreationPolicy(STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(hc -> hc.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .cors(cc -> cc.configurationSource(req -> {
                    val config = new CorsConfiguration();
                    config.setAllowedOrigins(apiConfigProps.cors().allowedOrigins());
                    config.setAllowedOriginPatterns(apiConfigProps.cors().allowedOriginPatterns());
                    config.setAllowedMethods(Collections.singletonList("*"));
                    config.setAllowedHeaders(Collections.singletonList("*"));
                    config.setAllowCredentials(true);
                    config.setMaxAge(3600L);
                    return config;
                }))
                .formLogin(AbstractHttpConfigurer::disable)
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(apiAuthenticationEntryPoint)
                        .accessDeniedHandler(apiAccessDeniedHandler))
                .authorizeHttpRequests(arc -> arc
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers("/api/v1/auth/otp/**").permitAll()
                        .requestMatchers(POST, "/api/v1/members").hasRole("SIGNUP")
                        .requestMatchers(GET, "/api/v1/members/check-username").permitAll()
                        .requestMatchers(GET, "/api/v1/members").hasRole("ADMIN")
                        .requestMatchers(GET, "/api/v1/companies").hasRole("ADMIN")
                        .requestMatchers(GET, "/api/v1/companies/me").hasRole("PLAN")
                        .requestMatchers(PUT, "/api/v1/companies/me").hasRole("PLAN")
                        .requestMatchers(DELETE, "/api/v1/companies/me").hasRole("PLAN")
                        .requestMatchers(POST, "/api/v1/companies/*/accept", "/api/v1/companies/*/deny").hasRole("ADMIN")
                        .requestMatchers(POST, "/api/v1/projects").hasRole("PLAN")
                        .requestMatchers(PUT, "/api/v1/projects/*").hasRole("PLAN")
                        .requestMatchers(DELETE, "/api/v1/projects/*").hasRole("PLAN")
                        .requestMatchers(POST, "/api/v1/tasks/company").hasRole("PLAN")
                        .requestMatchers(PUT, "/api/v1/tasks/*/company").hasRole("PLAN")
                        .requestMatchers(GET, "/api/v1/tasks/*/offers").hasRole("PLAN")
                        .requestMatchers(POST, "/api/v1/tasks/worker").hasRole("CAREER")
                        .requestMatchers(PUT, "/api/v1/tasks/*/worker").hasRole("CAREER")
                        .requestMatchers(PUT, "/api/v1/tasks/*/assignee").hasRole("CAREER")
                        .requestMatchers(POST, "/api/v1/offers").hasRole("PLAN")
                        .requestMatchers(PUT, "/api/v1/offers/reorder").hasRole("PLAN")
                        .requestMatchers(POST, "/api/v1/offers/*/cancel").hasRole("PLAN")
                        .requestMatchers(POST, "/api/v1/offers/*/accept").hasRole("CAREER")
                        .requestMatchers(POST, "/api/v1/offers/*/deny").hasRole("CAREER")
                        .requestMatchers(GET, "/api/v1/coworkers/*/tasks").hasRole("CAREER")
                        .requestMatchers(DELETE, "/api/v1/coworkers/*").hasRole("CAREER")
                        .requestMatchers(POST, "/api/v1/posts").hasRole("CAREER")
                        .requestMatchers(PUT, "/api/v1/posts/*").hasRole("CAREER")
                        .requestMatchers(DELETE, "/api/v1/posts/*").hasRole("CAREER")
                        .requestMatchers(GET, "/api/v1/profiles/me").authenticated()
                        .requestMatchers(GET, "/api/v1/profiles/**").permitAll()
                        .requestMatchers(GET, "/api/v1/feeds/**").permitAll()
                        .requestMatchers(GET, "/api/v1/credentials/me").authenticated()
                        .requestMatchers(GET, "/api/v1/credentials/**").permitAll()
                        .requestMatchers(POST, "/api/v1/credentials/*/accept", "/api/v1/credentials/*/deny").hasRole("ADMIN")
                        .requestMatchers(GET, "/api/v1/recommendations/received", "/api/v1/recommendations/sent").permitAll()
                        .requestMatchers(GET, "/api/v1/crawled-members/**").permitAll()
                        .requestMatchers(POST, "/api/v1/one-click").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/v3/api-docs*").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated())
                .addFilterAfter(verifyOtpFilter, LogoutFilter.class)
                .addFilterAfter(accessTokenAuthenticationFilter, LogoutFilter.class)
                .addFilterAfter(refreshTokenAuthenticationFilter, LogoutFilter.class)
                .addFilterAfter(signupTokenAuthenticationFilter, LogoutFilter.class);

        return http.build();
    }
}
