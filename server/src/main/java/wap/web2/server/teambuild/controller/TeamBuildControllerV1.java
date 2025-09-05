package wap.web2.server.teambuild.controller;

import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.service.ProjectService;
import wap.web2.server.teambuild.dto.response.ProjectTemplate;
import wap.web2.server.teambuild.dto.response.TeamBuildingResults;
import wap.web2.server.teambuild.service.TeamBuildResultService;

@Slf4j
@Controller
@RequestMapping("/team-build")
@RequiredArgsConstructor
public class TeamBuildControllerV1 {

    private final ProjectService projectService;
    private final TeamBuildResultService teamBuildResultService;

    @GetMapping
    public String entry(Model model,
                        @CurrentUser UserPrincipal userPrincipal,
                        @CookieValue(name = "authToken", required = false) String authToken) {
        if (projectService.isLeader(userPrincipal.getId())) {
            return "redirect:/team-build/recruit";
        } else {
            return "redirect:/team-build/projects";
        }
    }

    @GetMapping("/projects")
    public String projects(Model model, @CookieValue(name = "authToken", required = false) String authToken)
            throws Exception {

        List<ProjectTemplate> projects = projectService.getCurrentProjectRecruits();

        System.out.println("authToken = " + authToken);
        model.addAttribute("projects", projects);
        model.addAttribute("authToken", authToken);

        return "projects-application";
    }

    // 리더용 모집하기 페이지
    @GetMapping("/recruit")
    public String recruitPage(Model model,
                              @CookieValue(name = "authToken", required = false) String authToken,
                              @CurrentUser UserPrincipal userPrincipal) throws Exception {

        // 리더(=로그인 유저)가 소유/담당한 프로젝트 목록 (원하는 기준으로 교체 OK)
        List<ProjectTemplate> myProjects = projectService.getCurrentProjectRecruits();

        System.out.println("authToken = " + authToken);

        model.addAttribute("projects", myProjects);
        model.addAttribute("authToken", authToken);
        model.addAttribute("leaderId", userPrincipal != null ? userPrincipal.getId() : null);

        return "projects-application-for-leader";
    }

    @GetMapping("/results")
    public String getTeamBuildResults(Model model) {
        TeamBuildingResults results = teamBuildResultService.getResults();

        log.info("[TeamBuildingResults]: {}", results.toString());
        model.addAttribute("teams", results);
        return "teams";
    }

}
