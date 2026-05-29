import io.karatelabs.core.Runner;
import io.karatelabs.core.SuiteResult;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class KarateRunner {

    @Test
    void run() {
        SuiteResult result = Runner.path("classpath:so/morton/api/api")
                .tags("~@ignore")
                .parallel(5);

        assertEquals(0, result.getScenarioFailedCount(), String.join("\n", result.getErrors()));
    }
}
