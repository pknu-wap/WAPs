package wap.web2.server.setting.dto.request;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class SettingUpdateRequestTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "김", "김개발", "가나다라마바사아자차", "a", "John", "John Doe", "Mary Jane Kim",
        "abcdefghijklmno", "  김개발  ", " John Doe "
    })
    void 한글_10자_또는_영문_15자_이내_이름은_허용한다(String name) {
        assertThat(validator.validate(new SettingUpdateRequest(name))).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "가나다라마바사아자차카", "abcdefghijklmnop", "Mary Jane Kimmmm","김John", "김 개발",
        "개발1", "John1", "김!", "John_Doe", "ㄱㄴㄷ", "John  Doe", "김\t개발"
    })
    void 규칙에_맞지_않는_이름은_거부한다(String name) {
        assertThat(validator.validate(new SettingUpdateRequest(name))).singleElement()
            .satisfies(violation -> assertThat(violation.getMessage())
                .isEqualTo("이름은 한글 10자 또는 영문 15자 이내로 입력해 주세요."));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", " ", "   "})
    void 빈_이름은_거부한다(String name) {
        assertThat(validator.validate(new SettingUpdateRequest(name))).anySatisfy(violation ->
            assertThat(violation.getMessage()).isEqualTo("이름을 입력해 주세요."));
    }

    @Test
    void 앞뒤_공백을_제거한다() {
        assertThat(new SettingUpdateRequest("  John Doe  ").name()).isEqualTo("John Doe");
    }
}
