package wap.web2.server.teambuild.entity;

public enum Position {

    FRONTEND(Field.WEB),
    BACKEND(Field.WEB),
    AI(Field.WEB),
    DESIGN(Field.WEB),
    EMBEDDED(Field.WEB),
    APP(Field.APP),
    GAME(Field.GAME);

    private final Field field;

    Position(Field field) {
        this.field = field;
    }

    public Field toField() {
        return field;
    }

}
