import { useEffect, useRef, useCallback } from "react";
import { throttle } from "lodash";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"];
const DEADLINE_KEY = "logout_deadline";
const MINUTES_KEY = "inactivity_minutes";
const CHECK_INTERVAL = 5000;

export const useInactivityLogout = () => {
  const intervalRef = useRef(null);

  const handleLogout = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    localStorage.clear();
    localStorage.setItem("show_session_expired", "true");
    window.location.href = "/";
  }, []);

  const resetDeadline = useCallback(() => {
    const minutes = Number(localStorage.getItem(MINUTES_KEY)) || 15;
    const deadline = Date.now() + minutes * 60 * 1000;
    localStorage.setItem(DEADLINE_KEY, deadline.toString());
  }, []);

  const throttledReset = useRef(throttle(resetDeadline, 10000)).current;

  useEffect(() => {
    // Check FIRST, before resetting — catches stale sessions from closed tabs
    const existingDeadline = Number(localStorage.getItem(DEADLINE_KEY));
    if (existingDeadline && Date.now() > existingDeadline) {
      handleLogout();
      return; // don't bother setting up listeners, we're logging out immediately
    }

    resetDeadline(); // safe to reset now — either no deadline existed, or it hasn't passed yet

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, throttledReset)
    );

    intervalRef.current = setInterval(() => {
      const deadline = Number(localStorage.getItem(DEADLINE_KEY));
      if (deadline && Date.now() > deadline) {
        handleLogout();
      }
    }, CHECK_INTERVAL);

    const handleStorage = (e) => {
      if (e.key === DEADLINE_KEY && e.newValue === null) {
        handleLogout();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, throttledReset)
      );
      window.removeEventListener("storage", handleStorage);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [resetDeadline, handleLogout]);
};