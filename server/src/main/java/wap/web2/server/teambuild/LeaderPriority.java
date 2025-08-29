package wap.web2.server.teambuild;

import java.util.ArrayDeque;
import java.util.List;
import java.util.Queue;

public class LeaderPriority {
    private int maxMemberNumber;
    private Queue<String> memberNames;

    public LeaderPriority(int maxMemberNumber, List<String> names) {
        this.maxMemberNumber = maxMemberNumber;
        this.memberNames = new ArrayDeque();
        this.memberNames.addAll(names);
    }

    public Queue<String> getMemberNames() {
        return this.memberNames;
    }

    public int getMaxMemberNumber() {
        return this.maxMemberNumber;
    }
}