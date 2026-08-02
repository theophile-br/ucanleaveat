import { STORAGE_KEYS } from "../shared/constants.js";

export async function loadState() {
    const all = await chrome.storage.local.get(Object.values(STORAGE_KEYS));
    return {
        lastUpdate: all[STORAGE_KEYS.LAST_UPDATE] ?? null,
        time: all[STORAGE_KEYS.TIME] ?? null,
        flexTime: all[STORAGE_KEYS.FLEX_TIME] ?? null,
        breakTime: all[STORAGE_KEYS.BREAK_TIME] ?? null,
        workRate: all[STORAGE_KEYS.WORK_RATE] ?? 100,
        records: all[STORAGE_KEYS.RECORDS] ?? null,
    };
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
