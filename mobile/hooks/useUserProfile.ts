import { useCallback, useEffect, useState } from "react";
import {
  fetchUserProfile,
  removeUserAvatar,
  uploadUserAvatar,
  type UserProfile,
} from "@/services/profile";

export function useUserProfile(authUserId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!authUserId) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      setProfile(await fetchUserProfile(authUserId));
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [authUserId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setAvatar = useCallback(
    async (uri: string, mimeType: string) => {
      if (!authUserId) return;
      const url = await uploadUserAvatar(authUserId, uri, mimeType);
      setProfile((prev) =>
        prev
          ? { ...prev, avatarUrl: url }
          : {
              id: authUserId,
              firstName: null,
              lastName: null,
              phone: null,
              avatarUrl: url,
            }
      );
    },
    [authUserId]
  );

  const clearAvatar = useCallback(async () => {
    if (!authUserId) return;
    await removeUserAvatar(authUserId);
    setProfile((prev) => (prev ? { ...prev, avatarUrl: null } : prev));
  }, [authUserId]);

  return { profile, loading, refresh, setAvatar, clearAvatar };
}
