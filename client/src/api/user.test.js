import { userApi } from "./user";
import apiClient from "./client";

jest.mock("./client", () => ({ patch: jest.fn() }));

test("name editing uses the existing settings API and its name response", async () => {
  apiClient.patch.mockResolvedValue({ name: "남궁민수" });

  const result = await userApi.updateName("남궁민수");

  expect(apiClient.patch).toHaveBeenCalledWith("/api/member/name", { name: "남궁민수" });
  expect(result).toEqual({ name: "남궁민수" });
});
