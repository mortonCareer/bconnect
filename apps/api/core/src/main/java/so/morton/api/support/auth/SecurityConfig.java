package so.morton.api.support.auth;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.authentication.logout.LogoutFilter;
import org.springframework.web.cors.CorsConfiguration;
import so.morton.api.config.AppProperties;
import so.morton.api.support.auth.jwt.AccessTokenAuthenticationFilter;
import so.morton.api.support.auth.jwt.JwtAuthenticationProvider;
import so.morton.api.support.auth.jwt.JwtProvider;
import so.morton.api.support.auth.jwt.RefreshTokenAuthenticationFilter;
import so.morton.api.support.auth.otp.OtpAuthenticationProvider;
import so.morton.api.support.auth.otp.OtpService;
import so.morton.api.support.auth.otp.SessionService;
import so.morton.api.support.auth.otp.VerifyOtpAuthenticationFilter;

import java.util.Collections;
import java.util.List;

import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final AppProperties appProperties;

    @Bean
    public AuthenticationManager authenticationManager(
            UserService userService,
            JwtProvider jwtProvider,
            OtpService otpService,
            SessionService sessionService) {

        JwtAuthenticationProvider jwtAuthenticationProvider = new JwtAuthenticationProvider(userService, sessionService, jwtProvider);
        OtpAuthenticationProvider otpAuthenticationProvider = new OtpAuthenticationProvider(otpService, userService);
        return new ProviderManager(jwtAuthenticationProvider, otpAuthenticationProvider);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    SecurityFilterChain defaultSecurityFilterChain(
            HttpSecurity http,
            AuthenticationManager authenticationManager,
            ObjectMapper objectMapper,
            AccessTokenAuthenticationFilter accessTokenAuthenticationFilter,
            RefreshTokenAuthenticationFilter refreshTokenAuthenticationFilter,
            @Qualifier("VerifyOtpAuthenticationSuccessHandler") AuthenticationSuccessHandler verifyOtpSuccessHandler
    ) throws Exception {
        VerifyOtpAuthenticationFilter verifyOtpFilter = new VerifyOtpAuthenticationFilter(authenticationManager, objectMapper);
        verifyOtpFilter.setAuthenticationSuccessHandler(verifyOtpSuccessHandler);

        http
                .sessionManagement(sc -> sc.sessionCreationPolicy(STATELESS))
                .csrf(AbstractHttpConfigurer::disable)
                .headers(hc -> hc.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .cors(cc -> cc.configurationSource(req -> {
                    CorsConfiguration config = new CorsConfiguration();
                    config.setAllowedOrigins(appProperties.cors().allowedOrigins());
                    config.setAllowedOriginPatterns(appProperties.cors().allowedOriginPatterns());
                    config.setAllowedMethods(Collections.singletonList("*"));
                    config.setAllowedHeaders(Collections.singletonList("*"));
                    config.setExposedHeaders(List.of("Authorization"));
                    config.setAllowCredentials(true);
                    config.setMaxAge(3600L);
                    return config;
                }))
                .formLogin(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(arc -> arc
                        .requestMatchers("/api/v1/auth/otp/**").permitAll()
                        .requestMatchers(POST, "/api/v1/members").permitAll()
                        .requestMatchers(GET, "/api/v1/profiles", "/api/v1/profiles/{id}").permitAll()
                        .requestMatchers(GET, "/api/v1/posts", "/api/v1/posts/{id}").permitAll()
                        .requestMatchers(GET, "/api/v1/tasks", "/api/v1/tasks/{id}").permitAll()
                        .requestMatchers(GET, "/api/v1/credentials").permitAll()
                        .requestMatchers(POST, "/api/v1/credentials/*/accept", "/api/v1/credentials/*/deny").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterAfter(verifyOtpFilter, LogoutFilter.class)
                .addFilterAfter(accessTokenAuthenticationFilter, LogoutFilter.class)
                .addFilterAfter(refreshTokenAuthenticationFilter, LogoutFilter.class);

        return http.build();
    }
}
