package wap.web2.server.setting.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.setting.dto.request.SettingUpdateRequest;
import wap.web2.server.setting.dto.response.SettingUpdateResponse;

@ExtendWith(MockitoExtension.class)
class SettingServiceTest {

    @Mock
    UserRepository userRepository;

    @InjectMocks
    SettingService settingService;

    @Test
    void 로그인한_유저의_이름을_변경한다() {
        // given
        User user = new User();
        user.setId(1L);
        user.setName("기존이름");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // when
        SettingUpdateResponse response =
            settingService.updateSetting(principal(1L), new SettingUpdateRequest("  김개발 "));

        // then
        assertThat(response.name()).isEqualTo("김개발");
        assertThat(user.getName()).isEqualTo("김개발");
    }

    @Test
    void 유저가_없으면_예외가_발생한다() {
        // given
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() ->
            settingService.updateSetting(principal(99L), new SettingUpdateRequest("김개발")))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessage("사용자를 찾을 수 없습니다.");
    }

    private UserPrincipal principal(Long userId) {
        UserPrincipal principal = mock(UserPrincipal.class);
        when(principal.getId()).thenReturn(userId);
        return principal;
    }
}
