export const ATOSS_TITLE_MARKER = "ATOSS";

export const DEFAULT_FULL_WORK_TIME_MINUTES = 492;
export const DEFAULT_MANDATORY_BREAK_MINUTES = 30;
export const WEEKLY_CAP_MINUTES = 45 * 60;

export const CHIP_IDS = ["timeToGo", "flex", "forecast", "today", "week"];
export const DEFAULT_CHIP_VISIBILITY = {
    timeToGo: true,
    flex: true,
    forecast: true,
    today: true,
    week: true,
    weeklyFlex: false,
};

export const THEMES = ["blue-purple", "dark", "pinky-winky", "orange", "sunrise", "green"];
export const DEFAULT_THEME = "dark";

export const STORAGE_KEYS = {
    LAST_UPDATE: "lastUpdate",
    TIME: "time",
    FLEX_TIME: "flexTime",
    BREAK_TIME: "breakTime",
    WORK_RATE: "workRate",
    FULL_WORK_TIME: "fullWorkTime",
    MANDATORY_BREAK: "mandatoryBreak",
    RECORDS: "records",
    WEEK_MINUTES: "weekMinutes",
    CHIP_VISIBILITY: "chipVisibility",
    THEME: "theme",
};
