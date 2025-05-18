package wap.web2.server.project.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.project.entity.TechStackName;
import wap.web2.server.project.dto.response.TechStackInfoResponse;
import wap.web2.server.project.dto.response.TechStackResponse;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/techStack")
public class TechStackController {

    @GetMapping("/list")
    public ResponseEntity<?> getTechStackList() {
        List<TechStackInfoResponse> techStackResponseList = Arrays.stream(TechStackName.values())
                .map(techStackName -> TechStackInfoResponse.builder()
                        .techStackName(techStackName)
                        .techStackType(TechStackInfoResponse.getTechStackType(techStackName))
                        .build()
                )
                .collect(Collectors.toList());
        TechStackResponse techStackResponse = TechStackResponse.builder()
                .techStackResponse(techStackResponseList)
                .build();
        return new ResponseEntity<>(techStackResponse, HttpStatus.OK);
    }


}
