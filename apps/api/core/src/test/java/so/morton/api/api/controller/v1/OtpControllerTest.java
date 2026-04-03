package so.morton.api.api.controller.v1;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import so.morton.api.config.IntegrationTest;
import org.springframework.test.web.servlet.MockMvc;
import so.morton.api.support.AuthExceptionCode;
import so.morton.api.support.fixture.OtpFactory;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;
import so.morton.api.support.auth.otp.OtpService;

import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static so.morton.api.support.TestUtils.errorResponse;
import static so.morton.api.support.TestUtils.successResponse;

@IntegrationTest
class OtpControllerTest {

    @MockitoBean private OtpService otpService;
    @Autowired private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Nested
    @DisplayName("POST /api/v1/auth/otp/send")
    class SendOtp {

        @Test
        @DisplayName("발송 성공")
        void send_success() throws Exception {
            // given
            var request = OtpFactory.sendCodeRequest();

            // when & then
            mockMvc.perform(post("/api/v1/auth/otp/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(successResponse());
        }

        @Test
        @DisplayName("재전송 대기 시간 이내 시 OTP_RATE_LIMIT")
        void send_rateLimited() throws Exception {
            // given
            doThrow(new CodeException(AuthExceptionCode.OTP_RATE_LIMIT))
                    .when(otpService).sendCode("01000000000");

            var request = OtpFactory.sendCodeRequest();

            // when & then
            mockMvc.perform(post("/api/v1/auth/otp/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(errorResponse(AuthExceptionCode.OTP_RATE_LIMIT));
        }

        @Test
        @DisplayName("일일 한도 초과 시 OTP_DAILY_LIMIT")
        void send_dailyLimitExceeded() throws Exception {
            // given
            doThrow(new CodeException(AuthExceptionCode.OTP_DAILY_LIMIT))
                    .when(otpService).sendCode("01000000000");

            var request = OtpFactory.sendCodeRequest();

            // when & then
            mockMvc.perform(post("/api/v1/auth/otp/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(errorResponse(AuthExceptionCode.OTP_DAILY_LIMIT));
        }

        @Test
        @DisplayName("phone 빈 값 시 400")
        void send_emptyPhone() throws Exception {
            // given
            String body = "{\"phone\":\"\"}";

            // when & then
            mockMvc.perform(post("/api/v1/auth/otp/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }

        @Test
        @DisplayName("phone 잘못된 패턴 시 400")
        void send_phoneWithLetters() throws Exception {
            // given
            String body = "{\"phone\":\"0101234abcd\"}";

            // when & then
            mockMvc.perform(post("/api/v1/auth/otp/send")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(errorResponse(CommonExceptionCode.NOT_VALID));
        }
    }
}
