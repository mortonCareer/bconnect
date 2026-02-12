package so.morton.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@ActiveProfiles("test")
@SpringBootTest
class ApiApplicationTests {

	@Test
	@DisplayName("애플리케이션 컨텍스트가 정상적으로 로드된다")
	void contextLoads() {
	}

}
