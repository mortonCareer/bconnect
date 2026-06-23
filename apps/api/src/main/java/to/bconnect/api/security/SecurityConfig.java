package to.bconnect.api.security;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.web.SecurityFilterChain;
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

import java.util.Collections;

import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.security.config.http.SessionCreationPolicy.STATELESS;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ApiConfigProps apiConfigProps;

    @Bean
    public AuthenticationManager authenticationManager(
            AuthUserService authUserService,
            JwtProvider jwtProvider,
            OtpService otpService,
            SessionService sessionService) {

        val jwtAuthenticationProvider = new JwtAuthenticationProvider(authUserService, sessionService, jwtProvider);
        val otpAuthenticationProvider = new OtpAuthenticationProvider(otpService, authUserService);
        return new ProviderManager(jwtAuthenticationProvider, otpAuthenticationProvider);
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
        val verifyOtpFilter = new VerifyOtpAuthenticationFilter(authenticationManager, objectMapper);
        verifyOtpFilter.setAuthenticationSuccessHandler(verifyOtpSuccessHandler);

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
                .authorizeHttpRequests(arc -> arc
                        .requestMatchers("/api/v1/auth/otp/**").permitAll()
                        .requestMatchers(POST, "/api/v1/members").permitAll()
                        .requestMatchers(GET, "/api/v1/members/check-username").permitAll()
                        .requestMatchers(GET, "/api/v1/members").hasRole("ADMIN")
                        .requestMatchers(GET, "/api/v1/profiles/**").permitAll()
                        .requestMatchers(GET, "/api/v1/feeds/**").permitAll()
                        .requestMatchers(GET, "/api/v1/credentials/me").authenticated()
                        .requestMatchers(GET, "/api/v1/credentials/**").permitAll()
                        .requestMatchers(POST, "/api/v1/credentials/*/accept", "/api/v1/credentials/*/deny").hasRole("ADMIN")
                        .requestMatchers(GET, "/api/v1/recommendations/received", "/api/v1/recommendations/sent").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/v3/api-docs.yaml").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated())
                .addFilterAfter(verifyOtpFilter, LogoutFilter.class)
                .addFilterAfter(accessTokenAuthenticationFilter, LogoutFilter.class)
                .addFilterAfter(refreshTokenAuthenticationFilter, LogoutFilter.class);

        return http.build();
    }
}
