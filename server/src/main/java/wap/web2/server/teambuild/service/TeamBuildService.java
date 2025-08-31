package wap.web2.server.teambuild.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.teambuild.repository.ProjectApplyRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitRepository;
import wap.web2.server.teambuild.repository.ProjectRecruitWishRepository;
import wap.web2.server.teambuild.service.impl.TeamBuilderImpl;

@Service
@RequiredArgsConstructor
public class TeamBuildService {

    private final ProjectRecruitWishRepository recruitWishRepository;
    private final ProjectRecruitRepository recruitRepository;
    private final ProjectApplyRepository applyRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    // TODO: 리턴값 고민
    public void makeTeam(UserPrincipal userPrincipal) {
        // TODO: 레포지토리 뒤져서 map화 하고, teamBuilder의 인자로 주입할 예정

        TeamBuilder teamBuilder = new TeamBuilderImpl();
    }

}
