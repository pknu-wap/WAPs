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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.TokenProvider;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.service.ProjectService;
import wap.web2.server.teambuild.dto.response.ProjectTemplate;
import wap.web2.server.teambuild.dto.response.TeamBuildingResults;
import wap.web2.server.teambuild.service.ApplyService;
import wap.web2.server.teambuild.service.TeamBuildResultService;

@Slf4j
@Controller
@RequestMapping("/team-build")
@RequiredArgsConstructor
public class TeamBuildControllerV1 {

    private final ApplyService applyService;
    private final TokenProvider tokenProvider;
    private final ProjectService projectService;
    private final TeamBuildResultService teamBuildResultService;

    @GetMapping
    public String entry(Model model,
                        @RequestParam(value = "token", required = false) String tokenParam,
                        @CookieValue(name = "authToken", required = false) String cookieToken,
                        HttpServletResponse response) throws Exception {
        log.info("[/team-build] cookieToken?={} / tokenParam?={}", cookieToken != null, tokenParam != null);

        // 0) 쿠키로부터 or 쿼리 파라미터로부터 주입될 토큰
        String token = null;

        // 1) 쿼리 파라미터 확인
        if (tokenParam != null && !tokenParam.isBlank()) {
            token = tokenParam;
            // 쿠키로 심기
            ResponseCookie set = ResponseCookie.from("authToken", token)
                    .httpOnly(false)          // JS 접근 필요하다면 false
                    .secure(true)             // HTTPS 환경만
                    .sameSite("None")         // 프론트/백 분리 도메인일 경우 None
                    .path("/")
                    .maxAge(java.time.Duration.ofDays(7))
                    .build();
            response.addHeader("Set-Cookie", set.toString());

            // URL 깨끗하게 만들기 (token 파라미터 제거)
            return "redirect:/team-build";
        }

        // 2) 쿠키 확인
        if (cookieToken != null && !cookieToken.isBlank()) {
            token = cookieToken;
        }

        // 3) 토큰이 여전히 null이면 로그인이 안된 것! (지금은 프론트 검증을 믿고 무시한다.)

        // 4) 토큰 파싱 후 분기
        Long userId = tokenProvider.getUserIdFromToken(token);

        // 4-1) 이번 학기 이미 지원을 한 사용자인가?
        if (applyService.hasAppliedThisSemester(userId)) {
            log.info("[/team-build] user {} already voted this semester", userId);
            return "already-applied";
        }

        // 4-2) 이번 학기 리더인가?
        boolean isLeader = projectService.isLeader(userId);

        // 4-3) 리더이면 모집화면으로, 아니라면 지원화면으로 redirect 한다.
        return isLeader ? "redirect:/team-build/recruit" : "redirect:/team-build/projects";
    }

    @GetMapping("/projects")
    public String projects(Model model,
                           @CookieValue(name = "authToken", required = false) String authToken) throws Exception {

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
