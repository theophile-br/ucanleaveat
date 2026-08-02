export const ATOSS_HOST = "ases.swiss-as.com";

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

export const STORAGE_KEYS = {
    LAST_UPDATE: "lastUpdate",
    TIME: "time",
    FLEX_TIME: "flexTime",
    BREAK_TIME: "breakTime",
    WORK_RATE: "workRate",
    RECORDS: "records",
};
