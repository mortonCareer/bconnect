package so.morton.api.api.controller.v1;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import so.morton.api.api.controller.v1.request.SendOtpRequest;
import so.morton.api.support.AuthExceptionCode;
import so.morton.api.support.CodeException;
import so.morton.api.support.auth.otp.OtpService;

import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
class OtpControllerTest {

    @MockitoBean
    private OtpService otpService;

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("OTP 발송을 요청하면 성공 응답을 반환한다")
    void send_success() throws Exception {
        // given
        SendOtpRequest request = new SendOtpRequest("01012345678");

        // when & then
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("재전송 대기 시간 이내에 요청하면 예외 응답을 반환한다")
    void send_rateLimited() throws Exception {
        // given
        doThrow(new CodeException(AuthExceptionCode.OTP_RATE_LIMIT))
                .when(otpService).send("01012345678");

        SendOtpRequest request = new SendOtpRequest("01012345678");

        // when & then
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(AuthExceptionCode.OTP_RATE_LIMIT.name()));
    }

    @Test
    @DisplayName("일일 발송 한도를 초과하면 예외 응답을 반환한다")
    void send_dailyLimitExceeded() throws Exception {
        // given
        doThrow(new CodeException(AuthExceptionCode.OTP_DAILY_LIMIT))
                .when(otpService).send("01012345678");

        SendOtpRequest request = new SendOtpRequest("01012345678");

        // when & then
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error").value(AuthExceptionCode.OTP_DAILY_LIMIT.name()));
    }

    @Test
    @DisplayName("전화번호가 비어있으면 예외 응답을 반환한다")
    void send_emptyPhone() throws Exception {
        // given
        String body = "{\"phone\":\"\"}";

        // when & then
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is5xxServerError());
    }
}
