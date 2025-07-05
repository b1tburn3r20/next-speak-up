import prisma from "@/prisma/client";

// Set or update a single user preference
export async function setUserPreference(
  userId: string,
  key: string,
  value: string
) {
  try {
    const preference = await prisma.userPreference.upsert({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
      update: {
        value,
        updatedAt: new Date(),
      },
      create: {
        userId,
        key,
        value,
      },
    });

    return { success: true, preference };
  } catch (error) {
    console.error("Error setting user preference:", error);
    return { success: false, error: "Failed to set preference" };
  }
}

// Set multiple preferences at once
export async function setUserPreferences(
  userId: string,
  preferences: Array<{ key: string; value: string }>
) {
  try {
    const results = await Promise.all(
      preferences.map(({ key, value }) =>
        prisma.userPreference.upsert({
          where: {
            userId_key: {
              userId,
              key,
            },
          },
          update: {
            value,
            updatedAt: new Date(),
          },
          create: {
            userId,
            key,
            value,
          },
        })
      )
    );

    return { success: true, preferences: results };
  } catch (error) {
    console.error("Error setting user preferences:", error);
    return { success: false, error: "Failed to set preferences" };
  }
}

// Get a single preference with optional fallback
export async function getUserPreference(
  userId: string,
  key: string,
  fallback?: string
) {
  try {
    const preference = await prisma.userPreference.findUnique({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    return preference?.value || fallback || null;
  } catch (error) {
    console.error("Error getting user preference:", error);
    return fallback || null;
  }
}

// Get all preferences for a user as key-value object
export async function getUserPreferences(userId: string) {
  try {
    const preferences = await prisma.userPreference.findMany({
      where: { userId },
      select: {
        key: true,
        value: true,
      },
    });

    // Convert to key-value object for easy access
    const prefsObject = preferences.reduce((acc, pref) => {
      acc[pref.key] = pref.value;
      return acc;
    }, {} as Record<string, string>);

    return { success: true, preferences: prefsObject };
  } catch (error) {
    console.error("Error getting user preferences:", error);
    return { success: false, error: "Failed to get preferences" };
  }
}

// Delete a specific preference
export async function deleteUserPreference(userId: string, key: string) {
  try {
    await prisma.userPreference.delete({
      where: {
        userId_key: {
          userId,
          key,
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting user preference:", error);
    return { success: false, error: "Failed to delete preference" };
  }
}

// Helper function to get any preference as boolean
export async function getUserPreferenceAsBoolean(
  userId: string,
  key: string,
  defaultValue: boolean = false
): Promise<boolean> {
  const preference = await getUserPreference(userId, key, String(defaultValue));
  return preference === "true";
}

// Helper function to get multiple specific preferences
export async function getSpecificUserPreferences(
  userId: string,
  keys: string[]
): Promise<Record<string, string | null>> {
  try {
    const preferences = await prisma.userPreference.findMany({
      where: {
        userId,
        key: {
          in: keys,
        },
      },
      select: {
        key: true,
        value: true,
      },
    });

    // Create object with all requested keys, null if not found
    const result: Record<string, string | null> = {};
    keys.forEach((key) => {
      const found = preferences.find((p) => p.key === key);
      result[key] = found?.value || null;
    });

    return result;
  } catch (error) {
    console.error("Error getting specific user preferences:", error);
    // Return object with all keys set to null on error
    return keys.reduce((acc, key) => {
      acc[key] = null;
      return acc;
    }, {} as Record<string, string | null>);
  }
}

// Set specific preferences by key-value pairs
export async function setSpecificUserPreferences(
  userId: string,
  preferences: Record<string, string>
): Promise<{ success: boolean; error?: string; preferences?: any[] }> {
  try {
    const entries = Object.entries(preferences);

    const results = await Promise.all(
      entries.map(([key, value]) =>
        prisma.userPreference.upsert({
          where: {
            userId_key: {
              userId,
              key,
            },
          },
          update: {
            value,
            updatedAt: new Date(),
          },
          create: {
            userId,
            key,
            value,
          },
        })
      )
    );

    return { success: true, preferences: results };
  } catch (error) {
    console.error("Error setting specific preferences:", error);
    return { success: false, error: "Failed to set preferences" };
  }
}
