import { useEffect, useState } from "react";
import { getToken } from "./api";

export function useAuthed() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    const sync = () => setAuthed(!!getToken());
    sync();
    window.addEventListener("farm-auth-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("farm-auth-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return authed;
}
