import { UCanLeaveAtModel } from "../models/u-can-leave-at-model.js";
import { DateTimeUtils } from "../shared/date-time-utils.js";
import { ATOSS_TITLE_MARKER, STORAGE_KEYS } from "../shared/constants.js";
import { loadState, saveComputed, saveWorkRate, saveFullWorkTime, saveMandatoryBreak } from "./storage.js";
import { clickTimeRecordingManually, waitForModalReady, scrapeAll, closeTimeRecordingManuallyModal } from "../content/scrape.js";
import {
    updateUI,
    setLoading,
    setError,
    clearError,
    setWorkRateValue,
    setFullWorkTimeValue,
    setMandatoryBreakValue,
    setForecastTime,
    setOnAtoss,
} from "./view.js";

const model = new UCanLeaveAtModel();
const $ = (id) => document.getElementById(id);

let currentLeavingTime = null;
let tickerId = null;

function tick() {
    if (currentLeavingTime == null) return;
    const now = DateTimeUtils.convertDateToTime(new Date());
    const timeToGo = currentLeavingTime - DateTimeUtils.convertTimeToMinutes(now);
    updateUI({ timeToGo });
}

function trackLeavingTime(time) {
    currentLeavingTime = time;
    tick();
    if (tickerId == null) {
        tickerId = setInterval(tick, 30_000);
    }
}

document.addEventListener("DOMContentLoaded", init);

async function init() {
    const state = await loadState();
    setWorkRateValue(state.workRate);
    setFullWorkTimeValue(state.fullWorkTime);
    setMandatoryBreakValue(state.mandatoryBreak);
    
    const isToday = DateTimeUtils.isToday(state.lastUpdate);

    if (state.time != null && state.records && isToday) {
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
    $("full-work-time").addEventListener("change", onFullWorkTimeChange);
    $("mandatory-break").addEventListener("change", onMandatoryBreakChange);
    $("flextime-forcast-time").addEventListener("change", onForecastChange);
    $("settings-toggle").addEventListener("click", toggleSettings);
}

function toggleSettings() {
    const main = $("main-view");
    const settings = $("settings-view");
    const opening = settings.style.display === "none";
    const [toShow, toHide] = opening ? [settings, main] : [main, settings];

    document.body.classList.toggle("settings-open", opening);
    toHide.classList.add("fading");
    setTimeout(() => {
        toHide.style.display = "none";
        toShow.style.display = "block";
        toShow.classList.add("fading");
        requestAnimationFrame(() => toShow.classList.remove("fading"));
    }, 200);
}

function currentFullWorkTime() {
    return DateTimeUtils.convertTimeToMinutes($("full-work-time").value);
}

function currentMandatoryBreak() {
    return DateTimeUtils.convertTimeToMinutes($("mandatory-break").value);
}

async function getActiveAtossTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.title) return null;
    return tab.title.toUpperCase().includes(ATOSS_TITLE_MARKER) ? tab.id : null;
}

async function runInTab(tabId, func, args = []) {
    const [{ result } = {}] = await chrome.scripting.executeScript({ target: { tabId }, func, args });
    return result;
}

function render(records, flexTime, lastUpdate) {
    const rate = parseInt($("work-rate").value);
    const { time, breakTime } = model.getTimeOfLeavingWork(records, rate, currentFullWorkTime(), currentMandatoryBreak());

    const now = DateTimeUtils.convertDateToTime(new Date());
    setForecastTime(now);
    const forecast = model.getFlextimeForcast(flexTime, breakTime, time, now);

    updateUI({ lastUpdate, time, breakTime, flexTime, flextimeForecast: forecast });
    trackLeavingTime(time);
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
        const click = await runInTab(tabId, clickTimeRecordingManually);
        if (!click?.ok) return setError(`Couldn't click on recording manually (${modal?.reason ?? "unknown"}).`);

        const modal = await runInTab(tabId, waitForModalReady);
        if (!modal?.ok) return setError(`Modal didn't show up (${modal?.reason ?? "unknown"}).`);

        const scrape = await runInTab(tabId, scrapeAll);
        if (!scrape?.ok) return setError(`Couldn't read your records (${scrape?.reason ?? "unknown"}).`);

        const close = await runInTab(tabId, closeTimeRecordingManuallyModal);
        if (!close?.ok) return setError(`Couldn't close time recording manually modal (${scrape?.reason ?? "unknown"}).`);
        

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
    const { time, breakTime } = model.getTimeOfLeavingWork(state.records, parseInt(event.target.value), currentFullWorkTime(), currentMandatoryBreak());
    await saveComputed({ time, breakTime });
    updateUI({ time, breakTime });
    trackLeavingTime(time);
}

async function onFullWorkTimeChange(event) {
    const minutes = DateTimeUtils.convertTimeToMinutes(event.target.value);
    await saveFullWorkTime(minutes);
    const state = await loadState();
    if (!state.records) return;
    const { time, breakTime } = model.getTimeOfLeavingWork(state.records, state.workRate, minutes, currentMandatoryBreak());
    await saveComputed({ time, breakTime });
    updateUI({ time, breakTime });
    trackLeavingTime(time);
}

async function onMandatoryBreakChange(event) {
    const minutes = DateTimeUtils.convertTimeToMinutes(event.target.value);
    await saveMandatoryBreak(minutes);
    const state = await loadState();
    if (!state.records) return;
    const { time, breakTime } = model.getTimeOfLeavingWork(state.records, state.workRate, currentFullWorkTime(), minutes);
    await saveComputed({ time, breakTime });
    updateUI({ time, breakTime });
    trackLeavingTime(time);
}

async function onForecastChange(event) {
    const state = await loadState();
    if (state.time == null || state.flexTime == null) return;
    const forecast = model.getFlextimeForcast(state.flexTime, state.breakTime, state.time, event.target.value);
    updateUI({ flextimeForecast: forecast });
}
