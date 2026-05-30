import { validateAtlasUri } from "../src/config/database";

describe("database configuration", () => {
  it("accepts only Atlas URIs targeting shopAPP", () => {
    expect(() =>
      validateAtlasUri("mongodb+srv://user:pass@cluster.example.mongodb.net/shopAPP")
    ).not.toThrow();
  });

  it("rejects local MongoDB URIs", () => {
    expect(() => validateAtlasUri("mongodb://localhost:27017/shopAPP")).toThrow(
      "MongoDB Atlas"
    );
  });

  it("rejects Atlas URIs targeting a different database", () => {
    expect(() =>
      validateAtlasUri("mongodb+srv://user:pass@cluster.example.mongodb.net/shopmanager")
    ).toThrow("shopAPP");
  });
});
