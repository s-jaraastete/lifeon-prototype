import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetworkOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return () => unsub();
  }, []);

  return online;
}
