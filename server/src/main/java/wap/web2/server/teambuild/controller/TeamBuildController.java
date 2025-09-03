package wap.web2.server.teambuild.controller;

import static wap.web2.server.util.SemesterGenerator.generateSemesterValue;
import static wap.web2.server.util.SemesterGenerator.generateYearValue;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;

import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.service.ProjectService;
import wap.web2.server.teambuild.dto.RecruitmentDto;
import wap.web2.server.teambuild.dto.request.ProjectAppliesRequest;
import wap.web2.server.teambuild.dto.response.ProjectAppliesResponse;
import wap.web2.server.teambuild.dto.response.TeamBuildingResults;
import wap.web2.server.teambuild.dto.response.ProjectTemplate;
import wap.web2.server.teambuild.service.ApplyService;
import wap.web2.server.teambuild.service.TeamBuildResultService;
import wap.web2.server.teambuild.service.TeamBuildService;

@Slf4j
@Controller
@RequestMapping("/team-build")
@RequiredArgsConstructor
public class TeamBuildController {

    private final TeamBuildResultService teamBuildResultService;
    private final TeamBuildService teamBuildService;
    private final ApplyService applyService;
    private final ProjectService projectService;

    // 프로젝트 신청 (for 팀원)
    @ResponseBody
    @PostMapping("/apply")
    public ResponseEntity<?> apply(@CurrentUser UserPrincipal userPrincipal,
                                   @Valid @RequestBody ProjectAppliesRequest request) {
        try {
            log.info("[/team-build/apply] {}: {}", userPrincipal.getId(), request.toString());
            applyService.apply(userPrincipal, request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 지원하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 지원 실패");
        }
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

    // 프로젝트에 신청한 사람 보기 (for 팀장)
    @ResponseBody
    @GetMapping("/{projectId}/applies")
    public ResponseEntity<?> getApplies(@CurrentUser UserPrincipal userPrincipal,
                                        @PathVariable("projectId") Long projectId) {
        try {
            ProjectAppliesResponse response = applyService.getApplies(userPrincipal, projectId);

            Map<String, Object> jsonResponse = new HashMap<>();
            jsonResponse.put("success", true);
            jsonResponse.put("projectId", projectId);
            jsonResponse.put("applies", response.getApplies());
            jsonResponse.put("totalCount", response.getApplies().size());

            return ResponseEntity.ok(jsonResponse);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "지원자 정보를 불러오는데 실패했습니다.");
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // 팀 구성 완료 (RecruitmentDto 사용)
    @ResponseBody
    @PostMapping("/preference")
    public ResponseEntity<?> setPreference(@CurrentUser UserPrincipal userPrincipal,
                                           @Valid @RequestBody RecruitmentDto request) {
        try {
            applyService.setPreference(userPrincipal, request);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "팀 구성이 완료되었습니다.");
            response.put("projectId", request.getProjectId());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "팀 구성 중 오류가 발생했습니다.");
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    // TODO: userPrincipal로 admin인지 권한 검사 할 수 있을듯
    // apply와 recruit이 준비되었을 때 팀 빌딩 알고리즘을 돌리는 api
    @ResponseBody
    @PostMapping("")
    public ResponseEntity<?> makeTeam(@CurrentUser UserPrincipal userPrincipal) {
        try {
            teamBuildService.makeTeam(userPrincipal);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 분배하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 분배 실패" + e.getMessage());
        }
    }

    @GetMapping("/result")
    public ResponseEntity<?> getTeamBuildResults() {
        try {
            TeamBuildingResults results = teamBuildResultService.getResults();
            return ResponseEntity.ok().body(results);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 조회 실패" + e.getMessage());
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

}
