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
    @DisplayName("OTP 발송 성공 시 200 응답")
    void sendOtp_성공_200() throws Exception {
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
    @DisplayName("일일 발송 제한 초과 시 429 응답")
    void sendOtp_rateLimit_429() throws Exception {
        // given
        doThrow(new CodeException(AuthExceptionCode.OTP_RATE_LIMIT))
                .when(otpService).send("01012345678");

        SendOtpRequest request = new SendOtpRequest("01012345678");

        // when & then
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("phone이 비어있으면 요청이 거부된다")
    void sendOtp_빈phone_거부() throws Exception {
        // given
        String body = "{\"phone\":\"\"}";

        // when & then
        // @NotBlank 검증 실패 → MethodArgumentNotValidException → 500 (ApiControllerAdvice에서 별도 처리 없음)
        mockMvc.perform(post("/auth/otp/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is5xxServerError());
    }
}
