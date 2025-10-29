package wap.web2.server.auth.payload;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse {

    private boolean success;
    private String message;

    public boolean isSuccess() {
        return success;
    }

}
