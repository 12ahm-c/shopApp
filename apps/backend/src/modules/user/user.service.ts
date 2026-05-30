import { User } from "./user.model";
import { AppError } from "../../utils/AppError";
import { hashPassword } from "../../utils/password.util";
import { serializeUser } from "../../utils/serializer";
import type { UpdateProfileInput } from "./user.validation";

export const userService = {
  async getUserById(userId: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User does not exist");
    }
    return user;
  },

  async updateCurrentUser(userId: string, input: UpdateProfileInput) {
    const user = await User.findById(userId).select("+refreshTokens");
    if (!user) {
      throw new AppError(404, "NOT_FOUND", "User does not exist");
    }

    if (input.name !== undefined) {
      user.name = input.name;
    }

    if (input.password !== undefined) {
      user.passwordHash = await hashPassword(input.password);
      user.refreshTokens.forEach((token) => {
        if (!token.revokedAt) {
          token.revokedAt = new Date();
        }
      });
    }

    await user.save();
    return serializeUser(user, { includeEmployment: user.role === "employee" });
  }
};
