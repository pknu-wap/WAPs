package wap.web2.server.teambuild.entity;

import java.util.Locale;

public enum Field {

    WEB,
    APP,
    GAME;

    public static Field fromProjectType(String projectType) {
        if (projectType == null) {
            return WEB;
        }
        try {
            return Field.valueOf(projectType.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return WEB;
        }
    }

}