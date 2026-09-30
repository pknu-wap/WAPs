package wap.web2.server.setting.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.setting.dto.request.SettingUpdateRequest;
import wap.web2.server.setting.dto.response.SettingUpdateResponse;

@Service
@RequiredArgsConstructor
public class SettingService {

    private final UserRepository userRepository;

    @Transactional
    public SettingUpdateResponse updateSetting(
        UserPrincipal userPrincipal,
        SettingUpdateRequest request
    ) {
        User user = findUser(userPrincipal.getId());
        user.setName(request.name());
        return SettingUpdateResponse.from(user);
    }

    private User findUser(Long userId) {
        return userRepository
            .findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("사용자를 찾을 수 없습니다."));
    }
}
