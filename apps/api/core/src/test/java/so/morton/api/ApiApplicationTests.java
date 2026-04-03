package so.morton.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
@SpringBootTest
class ApiApplicationTests {

	@Test
	@DisplayName("컨텍스트 로드 성공")
	void contextLoads() {
	}

}
