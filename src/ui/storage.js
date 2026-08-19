import { STORAGE_KEYS, DEFAULT_FULL_WORK_TIME_MINUTES, DEFAULT_MANDATORY_BREAK_MINUTES, DEFAULT_THEME, DEFAULT_CHIP_VISIBILITY } from "../shared/constants.js";

export async function loadState() {
    const all = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
    return {
        lastUpdate: all[STORAGE_KEYS.LAST_UPDATE] ?? null,
        time: all[STORAGE_KEYS.TIME] ?? null,
        flexTime: all[STORAGE_KEYS.FLEX_TIME] ?? null,
        breakTime: all[STORAGE_KEYS.BREAK_TIME] ?? null,
        workRate: all[STORAGE_KEYS.WORK_RATE] ?? 100,
        fullWorkTime: all[STORAGE_KEYS.FULL_WORK_TIME] ?? DEFAULT_FULL_WORK_TIME_MINUTES,
        mandatoryBreak: all[STORAGE_KEYS.MANDATORY_BREAK] ?? DEFAULT_MANDATORY_BREAK_MINUTES,
        records: all[STORAGE_KEYS.RECORDS] ?? null,
        weekMinutes: all[STORAGE_KEYS.WEEK_MINUTES] ?? null,
        chipVisibility: { ...DEFAULT_CHIP_VISIBILITY, ...(all[STORAGE_KEYS.CHIP_VISIBILITY] ?? {}) },
        theme: all[STORAGE_KEYS.THEME] ?? DEFAULT_THEME,
    };
}

export function saveWeekMinutes(weekMinutes) {
    return chrome.storage.local.set({ [STORAGE_KEYS.WEEK_MINUTES]: weekMinutes });
}

export function saveChipVisibility(chipVisibility) {
    return chrome.storage.local.set({ [STORAGE_KEYS.CHIP_VISIBILITY]: chipVisibility });
}

export function saveComputed({ time, breakTime }) {
    return chrome.storage.local.set({
        [STORAGE_KEYS.TIME]: time,
        [STORAGE_KEYS.BREAK_TIME]: breakTime,
    });
}

export function saveWorkRate(workRate) {
    return chrome.storage.local.set({ [STORAGE_KEYS.WORK_RATE]: workRate });
}

export function saveFullWorkTime(fullWorkTime) {
    return chrome.storage.local.set({ [STORAGE_KEYS.FULL_WORK_TIME]: fullWorkTime });
}

export function saveMandatoryBreak(mandatoryBreak) {
    return chrome.storage.local.set({ [STORAGE_KEYS.MANDATORY_BREAK]: mandatoryBreak });
}

export function saveTheme(theme) {
    return chrome.storage.local.set({ [STORAGE_KEYS.THEME]: theme });
}
