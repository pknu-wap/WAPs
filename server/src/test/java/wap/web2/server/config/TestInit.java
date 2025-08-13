package wap.web2.server.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import wap.web2.server.member.repository.UserRepository;

@Component
public class TestInit {

    public static final int USER_COUNT = 30;

    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    void setUp() {
//        // 테스트 유저 세팅
//        List<User> batch = new ArrayList<>();
//        for (int i = 1; i <= USER_COUNT; i++) {
//            User u = new User();
//            u.setName("user-" + i);
//            u.setEmail("user-" + i + "@naver.com");
//            u.setEmailVerified(true);
//            u.setProvider(AuthProvider.local);
//            batch.add(u);
//        }
//        userRepository.saveAll(batch);

        // 테스트 프로젝트는 swagger를 통한 생성?
    }

}
