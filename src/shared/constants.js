export const ATOSS_TITLE_MARKER = "ATOSS";

const BREAK_LABELS = ["break", "pause"];
const PRESENCE_LABELS = ["presence", "anwesenheit"];

const norm = (t) => (t ?? "").toString().toLowerCase().trim();

export const isBreak = (type) => BREAK_LABELS.includes(norm(type));

const isPresence = (type) => PRESENCE_LABELS.includes(norm(type));

const isHomeOffice = (type) => {
    const t = norm(type);
    return t.includes("home office") || t.includes("home-office") || t.includes("homeoffice");
};

export const isWork = (type) => isPresence(type) || isHomeOffice(type);

export const DEFAULT_FULL_WORK_TIME_MINUTES = 492;
export const DEFAULT_MANDATORY_BREAK_MINUTES = 30;

export const STORAGE_KEYS = {
    LAST_UPDATE: "lastUpdate",
    TIME: "time",
    FLEX_TIME: "flexTime",
    BREAK_TIME: "breakTime",
    WORK_RATE: "workRate",
    FULL_WORK_TIME: "fullWorkTime",
    MANDATORY_BREAK: "mandatoryBreak",
    RECORDS: "records",
};
