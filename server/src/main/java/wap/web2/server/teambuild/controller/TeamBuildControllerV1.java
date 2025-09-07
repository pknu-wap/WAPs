package wap.web2.server.teambuild.controller;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.TokenProvider;
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

    private final TokenProvider tokenProvider;
    private final ProjectService projectService;
    private final TeamBuildResultService teamBuildResultService;

    @GetMapping
    public String entry(Model model,
                        @CurrentUser UserPrincipal userPrincipal,
                        @CookieValue(name = "authToken", required = false) String cookieToken,
                        @RequestHeader(value = "Authorization", required = false) String authHeader,
                        HttpServletResponse response) throws Exception {
        log.info("[/team-build] entry parameter is null: userPrincipal={}, cookieToken={}, authHeader{}",
                userPrincipal == null, cookieToken == null, authHeader == null);
        // 1) 쿠키에 토큰이 이미 있으면 그걸 사용
        String token = (cookieToken != null && !cookieToken.isBlank()) ? cookieToken : null;

        // 2) 쿠키가 없고 Authorization 헤더가 있으면 Bearer 토큰 추출해서 쿠키로 심기 (한 번만)
        if (token == null && authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);

            ResponseCookie set = ResponseCookie.from("authToken", token)
                    .httpOnly(false)          // 타임리프 JS에서 읽어야 하면 false (가능하면 다른 안전한 주입 방식 권장)
                    .secure(true)             // https 환경에서만
                    .sameSite("Lax")         // 프론트/백 분리(크로스 도메인)면 None
                    .path("/")
                    .maxAge(java.time.Duration.ofDays(7))
                    .build();
            response.addHeader("Set-Cookie", set.toString());
        }

        // 4) 여기부터는 쿠키 기반으로 분기
        Long userId = tokenProvider.getUserIdFromToken(token);
        boolean isLeader = projectService.isLeader(userId);

        return isLeader
                ? recruitPage(model, token, userPrincipal)
                : projects(model, token);
    }

    @GetMapping("/projects")
    public String projects(Model model, @CookieValue(name = "authToken", required = false) String authToken)
            throws Exception {

        List<ProjectTemplate> projects = projectService.getCurrentProjectRecruits();

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
