import { StoreSettings } from "./settings.model";
import { serializeSettings } from "../../utils/serializer";
import type { UpdateSettingsInput } from "./settings.validation";

export const settingsService = {
  async getSettings() {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({});
    }
    return serializeSettings(settings);
  },

  async updateSettings(input: UpdateSettingsInput) {
    const settings = await StoreSettings.findOneAndUpdate(
      {},
      { $set: input },
      { returnDocument: "after", upsert: true, runValidators: true }
    );
    return serializeSettings(settings);
  }
};
