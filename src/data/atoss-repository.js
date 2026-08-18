import {
    clickTimeRecordingManually,
    waitForModalReady,
    scrapeAll,
    closeTimeRecordingManuallyModal,
    clickGraphicalOverview,
    waitForGraphicalOverviewReady,
    scrapeWeekPastMinutes,
    closeGraphicalOverview,
} from "../content/scrape.js";
import { DateTimeUtils } from "../shared/date-time-utils.js";

export class ScrapeError extends Error {
    constructor(step, reason) {
        super(`Scrape failed at "${step}" (${reason ?? "unknown"}).`);
        this.name = "ScrapeError";
        this.step = step;
        this.reason = reason;
    }
}

export class AtossRepository {
    constructor(tabId) {
        this.tabId = tabId;
    }

    async fetchAll() {
        const { records, flexTime } = await this.#fetchTodayRecords();
        const weekPastMinutes = await this.#fetchWeekPastMinutes();
        return { records, flexTime, weekPastMinutes };
    }

    async #fetchTodayRecords() {
        const click = await this.#run(clickTimeRecordingManually);
        if (!click?.ok) throw new ScrapeError("open-recording", click?.reason);

        const modal = await this.#run(waitForModalReady);
        if (!modal?.ok) throw new ScrapeError("modal", modal?.reason);

        const scrape = await this.#run(scrapeAll);
        if (!scrape?.ok) {
            await this.#run(closeTimeRecordingManuallyModal);
            throw new ScrapeError("scrape", scrape?.reason);
        }

        const close = await this.#run(closeTimeRecordingManuallyModal);
        if (!close?.ok) throw new ScrapeError("close-recording", close?.reason);

        return {
            records: scrape.records,
            flexTime: DateTimeUtils.convertTimeToMinutes(scrape.flextime),
        };
    }

    async #fetchWeekPastMinutes() {
        const dow = new Date().getDay();
        if (dow === 0 || dow === 1 || dow === 6) return null;

        const click = await this.#run(clickGraphicalOverview);
        if (!click?.ok) return null;

        const ready = await this.#run(waitForGraphicalOverviewReady);
        if (!ready?.ok) {
            await this.#run(closeGraphicalOverview);
            return null;
        }

        const week = await this.#run(scrapeWeekPastMinutes);
        await this.#run(closeGraphicalOverview);
        return week?.ok ? week.pastMinutes : null;
    }

    async #run(func, args = []) {
        const [{ result } = {}] = await chrome.scripting.executeScript({
            target: { tabId: this.tabId },
            func,
            args,
        });
        return result;
    }
}
