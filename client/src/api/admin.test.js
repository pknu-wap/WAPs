import { adminPermissonApi } from "./admin";
import apiClient from "./client";

jest.mock("./client", () => ({ get: jest.fn() }));

const legacyUsers = [
  { id: 1, name: "신입 회원", role: "ROLE_MEMBER", membershipLevel: "NEW" },
  { id: 2, name: "준회원", role: "ROLE_MEMBER", membershipLevel: "ASSOCIATE" },
  { id: 3, name: "정회원", role: "ROLE_ADMIN", membershipLevel: "REGULAR" },
  { id: 4, name: "미정 회원", role: "ROLE_GUEST", membershipLevel: "NONE" },
];

beforeEach(() => {
  jest.resetAllMocks();
});

test.each(["NEW", "ASSOCIATE", "REGULAR"])(
  "LEVEL %s filters a server using membershipLevel and displays its saved value",
  async (level) => {
    apiClient.get.mockImplementation((url, { params }) =>
      Promise.resolve({
        content: legacyUsers.filter(
          (user) =>
            !params.membershipLevel ||
            user.membershipLevel === params.membershipLevel,
        ),
        hasNext: false,
      }),
    );

    const result = await adminPermissonApi.getUserRoleList(0, 12, "", level);

    expect(apiClient.get).toHaveBeenCalledWith("/admin/role", {
      params: { page: 0, size: 12, memberType: level, membershipLevel: level },
    });
    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toEqual(
      expect.objectContaining({ membershipLevel: level, memberType: level }),
    );
  },
);

test("undecided LEVEL is sent as NONE for the existing server", async () => {
  apiClient.get.mockResolvedValue({
    content: [legacyUsers[3]],
    hasNext: false,
  });

  const result = await adminPermissonApi.getUserRoleList(
    0,
    12,
    "ROLE_GUEST",
    "UNDECIDED",
  );

  expect(apiClient.get).toHaveBeenCalledWith("/admin/role", {
    params: {
      page: 0,
      size: 12,
      role: "ROLE_GUEST",
      memberType: "UNDECIDED",
      membershipLevel: "NONE",
    },
  });
  expect(result.content[0].memberType).toBe("UNDECIDED");
});

test("memberType responses and ROLE/LEVEL pagination remain supported", async () => {
  const user = {
    id: 5,
    name: "회원",
    role: "ROLE_MEMBER",
    memberType: "ASSOCIATE",
  };
  apiClient.get.mockResolvedValue({ content: [user], hasNext: true });

  const result = await adminPermissonApi.getUserRoleList(
    1,
    12,
    "ROLE_MEMBER",
    "ASSOCIATE",
  );

  expect(apiClient.get).toHaveBeenCalledWith("/admin/role", {
    params: {
      page: 1,
      size: 12,
      role: "ROLE_MEMBER",
      memberType: "ASSOCIATE",
      membershipLevel: "ASSOCIATE",
    },
  });
  expect(result).toEqual({ content: [user], hasNext: true });
});

test("ALL omits both LEVEL filters and missing saved levels display as undecided", async () => {
  apiClient.get.mockResolvedValue({
    content: [{ id: 6, memberType: null }],
    hasNext: false,
  });

  const result = await adminPermissonApi.getUserRoleList(0, 12, "", "");

  expect(apiClient.get).toHaveBeenCalledWith("/admin/role", {
    params: { page: 0, size: 12 },
  });
  expect(result.content[0].memberType).toBe("UNDECIDED");
});

test("memberType takes precedence when both response fields are present", async () => {
  apiClient.get.mockResolvedValue({
    content: [{ id: 7, memberType: "NEW", membershipLevel: "REGULAR" }],
    hasNext: false,
  });

  const result = await adminPermissonApi.getUserRoleList(0, 12);

  expect(result.content[0].memberType).toBe("NEW");
});
