import { UCanLeaveAtModel } from "../models/u-can-leave-at-model.js";
import { DateTimeUtils } from "../shared/date-time-utils.js";
import { ATOSS_HOST, STORAGE_KEYS } from "../shared/constants.js";
import { loadState, saveComputed, saveWorkRate } from "./storage.js";
import { scrapeAll } from "../content/scrape.js";
import {
    updateUI,
    setLoading,
    setError,
    clearError,
    setWorkRateValue,
    setForecastTime,
    setOnAtoss,
} from "./view.js";

const model = new UCanLeaveAtModel();
const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", init);

async function init() {
    const state = await loadState();
    setWorkRateValue(state.workRate);

    if (state.time != null && state.records) {
        render(state.records, state.flexTime, state.lastUpdate);
    } else {
        setError("No data found. Please open ATOSS and click the Update button to load the latest information.")
    }
    setLoading(false);

    setOnAtoss((await getActiveAtossTabId()) != null);
    wireEvents();
}

function wireEvents() {
    $("update").addEventListener("click", onUpdate);
    $("work-rate").addEventListener("change", onWorkRateChange);
    $("work-rate").addEventListener("keydown", e => e.preventDefault());
    $("flextime-forcast-time").addEventListener("change", onForecastChange);
}

async function getActiveAtossTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return null;
    try {
        return new URL(tab.url).host === ATOSS_HOST ? tab.id : null;
    } catch (_e) {
        return null;
    }
}

async function runInTab(tabId, func, args = []) {
    const [{ result } = {}] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
    return result;
}

function render(records, flexTime, lastUpdate) {
    const rate = parseInt($("work-rate").value);
    const { time, breakTime } = model.getTimeOfLeavingWork(records, rate);

    const now = DateTimeUtils.convertDateToTime(new Date());
    setForecastTime(now);
    const forecast = model.getFlextimeForcast(flexTime, breakTime, time, now);

    updateUI({ lastUpdate, time, breakTime, flexTime, flextimeForecast: forecast });
    return { time, breakTime };
}

async function onUpdate() {
    clearError();

    const tabId = await getActiveAtossTabId();
    if (tabId == null) {
        setOnAtoss(false);
        return;
    }

    setLoading(true);
    try {
        const scrape = await runInTab(tabId, scrapeAll);
        if (!scrape?.ok) return setError(`Couldn't read your records (${scrape?.reason ?? "unknown"}).`);

        const flexTime = DateTimeUtils.convertTimeToMinutes(scrape.flextime);
        const fetchedAt = Date.now();
        await chrome.storage.local.set({
            [STORAGE_KEYS.LAST_UPDATE]: fetchedAt,
            [STORAGE_KEYS.FLEX_TIME]: flexTime,
            [STORAGE_KEYS.RECORDS]: scrape.records,
        });

        const { time, breakTime } = render(scrape.records, flexTime, fetchedAt);
        await saveComputed({ time, breakTime });
        setLoading(false);
    } catch (e) {
        setError(e?.message ?? "Fetch failed");
    }
}

async function onWorkRateChange(event) {
    await saveWorkRate(event.target.value);
    const state = await loadState();
    if (!state.records) return;
    const { time, breakTime } = model.getTimeOfLeavingWork(state.records, parseInt(event.target.value));
    await saveComputed({ time, breakTime });
    updateUI({ time, breakTime });
}

async function onForecastChange(event) {
    const state = await loadState();
    if (state.time == null || state.flexTime == null) return;
    const forecast = model.getFlextimeForcast(state.flexTime, state.breakTime, state.time, event.target.value);
    updateUI({ flextimeForecast: forecast });
}
