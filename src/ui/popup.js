import { UCanLeaveAtModel, OvernightWorkError } from "../models/u-can-leave-at-model.js";
import { DateTimeUtils } from "../shared/date-time-utils.js";
import { ATOSS_TITLE_MARKER, STORAGE_KEYS } from "../shared/constants.js";
import { AtossRepository, ScrapeError } from "../data/atoss-repository.js";
import { loadState, saveComputed, saveWorkRate, saveFullWorkTime, saveMandatoryBreak, saveWeekMinutes, saveTheme } from "./storage.js";
import {
    updateUI,
    setLoading,
    setError,
    clearError,
    setWorkRateValue,
    setFullWorkTimeValue,
    setMandatoryBreakValue,
    setEmploymentPreview,
    setOnAtoss,
    setTheme,
    setActiveSwatch,
} from "./view.js";

const model = new UCanLeaveAtModel();
const $ = (id) => document.getElementById(id);

let currentRecords = null;
let currentWeekPastMinutes = null;
let currentFlexTime = null;
let currentLastUpdate = null;
let tickerId = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
    const state = await loadState();
    setTheme(state.theme);
    setActiveSwatch(state.theme);
    setWorkRateValue(state.workRate);
    setFullWorkTimeValue(state.fullWorkTime);
    setMandatoryBreakValue(state.mandatoryBreak);
    refreshEmploymentPreview();

    const isToday = DateTimeUtils.isToday(state.lastUpdate);

    if (state.time != null && state.records && isToday) {
        currentRecords = state.records;
        currentFlexTime = state.flexTime;
        currentWeekPastMinutes = state.weekMinutes;
        currentLastUpdate = state.lastUpdate;
        recompute();
    } else {
        setError("No data found. Please open ATOSS and click the Update button to load the latest information.");
    }
    setLoading(false);

    setOnAtoss((await getActiveAtossTabId()) != null);
    wireEvents();
}

function wireEvents() {
    $("update").addEventListener("click", onUpdate);
    $("work-rate").addEventListener("change", onSettingsChange);
    $("work-rate").addEventListener("keydown", e => e.preventDefault());
    $("full-work-time").addEventListener("change", onSettingsChange);
    $("mandatory-break").addEventListener("change", onSettingsChange);
    $("settings-toggle").addEventListener("click", toggleSettings);
    document.querySelectorAll(".swatch").forEach(el => el.addEventListener("click", onThemeClick));
}

async function onThemeClick(e) {
    const theme = e.currentTarget.dataset.theme;
    setTheme(theme);
    setActiveSwatch(theme);
    await saveTheme(theme);
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

function currentWorkRate() {
    return parseInt($("work-rate").value);
}

function currentFullWorkTime() {
    return DateTimeUtils.convertTimeToMinutes($("full-work-time").value);
}

function currentMandatoryBreak() {
    return DateTimeUtils.convertTimeToMinutes($("mandatory-break").value);
}

function refreshEmploymentPreview() {
    const rate = currentWorkRate();
    if (rate === 100) {
        setEmploymentPreview(null);
        return;
    }
    setEmploymentPreview(Math.ceil(currentFullWorkTime() * rate / 100));
}

async function getActiveAtossTabId() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.title) return null;
    return tab.title.toUpperCase().includes(ATOSS_TITLE_MARKER) ? tab.id : null;
}

async function recompute({ persist = false } = {}) {
    if (!currentRecords) return;
    try {
        const result = model.compute({
            records: currentRecords,
            flexTime: currentFlexTime,
            weekPastMinutes: currentWeekPastMinutes,
            workRate: currentWorkRate(),
            fullWorkTime: currentFullWorkTime(),
            mandatoryBreak: currentMandatoryBreak(),
        });
        clearError();
        updateUI({
            lastUpdate: currentLastUpdate,
            time: result.leavingTime,
            breakTime: result.breakTime,
            flexTime: currentFlexTime,
            flextimeForecast: result.flextimeForecast,
            timeToGo: model.formatTimeToGo(result.timeToGo),
            todayMinutes: result.todayMinutes,
            weekMinutes: result.weekMinutes,
        });
        if (persist) {
            await saveComputed({ time: result.leavingTime, breakTime: result.breakTime });
        }
        scheduleTicker();
    } catch (e) {
        if (e instanceof OvernightWorkError) {
            setError(e.message);
        } else {
            throw e;
        }
    }
}

function scheduleTicker() {
    if (tickerId == null) {
        tickerId = setInterval(() => recompute(), 30_000);
    }
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
        const repo = new AtossRepository(tabId);
        const { records, flexTime, weekPastMinutes } = await repo.fetchAll();

        const fetchedAt = Date.now();
        await chrome.storage.local.set({
            [STORAGE_KEYS.LAST_UPDATE]: fetchedAt,
            [STORAGE_KEYS.FLEX_TIME]: flexTime,
            [STORAGE_KEYS.RECORDS]: records,
        });
        await saveWeekMinutes(weekPastMinutes);

        currentRecords = records;
        currentFlexTime = flexTime;
        currentWeekPastMinutes = weekPastMinutes;
        currentLastUpdate = fetchedAt;

        await recompute({ persist: true });
    } catch (e) {
        if (e instanceof ScrapeError || e instanceof OvernightWorkError) {
            setError(e.message);
        } else {
            setError(e?.message ?? "Fetch failed");
        }
    } finally {
        setLoading(false);
    }
}

async function onSettingsChange() {
    await saveWorkRate(currentWorkRate());
    await saveFullWorkTime(currentFullWorkTime());
    await saveMandatoryBreak(currentMandatoryBreak());
    refreshEmploymentPreview();
    await recompute({ persist: true });
}
