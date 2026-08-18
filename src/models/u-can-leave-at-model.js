import { AtossRecord } from "./atoss-record.js";
import { DEFAULT_FULL_WORK_TIME_MINUTES, DEFAULT_MANDATORY_BREAK_MINUTES } from "../shared/constants.js";

const MINUTES_PER_DAY = 24 * 60;

export class OvernightWorkError extends Error {
    constructor(message, { clockIn = null, leavingTime = null } = {}) {
        super(message);
        this.name = "OvernightWorkError";
        this.clockIn = clockIn;
        this.leavingTime = leavingTime;
    }
}

export class UCanLeaveAtModel {
    mandatoryBreakTime = DEFAULT_MANDATORY_BREAK_MINUTES;
    fullWorkTime = DEFAULT_FULL_WORK_TIME_MINUTES;

    compute({ records, flexTime, weekPastMinutes, workRate, fullWorkTime, mandatoryBreak }) {
        const model = (records ?? []).map(AtossRecord.from);
        this.#assertNoOvernightRecord(model);

        const rate = workRate ?? 100;
        const dailyTarget = fullWorkTime ?? this.fullWorkTime;
        const breakTarget = mandatoryBreak ?? this.mandatoryBreakTime;

        const { time: leavingTime, breakTime } = this.#leavingTimeFrom(model, rate, dailyTarget, breakTarget);

        if (leavingTime != null && leavingTime > MINUTES_PER_DAY) {
            const clockIn = model.find(r => r.isWork())?.start ?? null;
            throw new OvernightWorkError(
                "Computed leaving time crosses midnight; overnight work is not supported.",
                { clockIn, leavingTime },
            );
        }

        const todayMinutes = this.#workedMinutes(model);
        const targetMinutes = Math.ceil(dailyTarget * rate / 100);
        const timeToGo = Math.round(targetMinutes - todayMinutes);

        const weekMinutes = weekPastMinutes != null
            ? weekPastMinutes + todayMinutes
            : todayMinutes;

        const flextimeForecast = flexTime != null
            ? this.#getFlextimeForcast(flexTime, todayMinutes, targetMinutes)
            : null;

        return { leavingTime, breakTime, todayMinutes, timeToGo, weekMinutes, flextimeForecast };
    }

    formatTimeToGo(timeToGo) {
        if (timeToGo == null || timeToGo === 0) return null;
        return timeToGo > 0
            ? { label: "to go", minutes: timeToGo }
            : { label: "extra time", minutes: Math.abs(timeToGo) };
    }

    #getFlextimeForcast(flexTime, workedMinutes, targetMinutes) {
        return flexTime + workedMinutes - targetMinutes;
    }

    #leavingTimeFrom(model, percentageOfWorkTimes, fullWorkTime, mandatoryBreakTime) {
        const rate = percentageOfWorkTimes / 100;
        const clockIn = model.find(r => r.isWork());
        const clockInTime = clockIn ? clockIn.start : null;

        const totalBreak = model
            .filter(r => r.isBreak())
            .reduce((a, b) => a + b.duration(), 0);

        const remainingMandatoryBreak = totalBreak >= mandatoryBreakTime
            ? 0
            : mandatoryBreakTime - totalBreak;

        const exceededBreak = totalBreak >= mandatoryBreakTime
            ? Math.abs(mandatoryBreakTime - totalBreak)
            : 0;

        const realFullWorkTime = Math.ceil(fullWorkTime * rate);

        return {
            time: clockInTime + realFullWorkTime + exceededBreak + mandatoryBreakTime,
            breakTime: remainingMandatoryBreak,
        };
    }

    #workedMinutes(model) {
        return model
            .filter(r => r.isWork())
            .reduce((sum, r) => sum + r.duration(), 0);
    }

    #assertNoOvernightRecord(model) {
        const bad = model.find(r => r.crossesMidnight());
        if (bad) {
            throw new OvernightWorkError(
                "A record crosses midnight; overnight work is not supported.",
                { clockIn: bad.start },
            );
        }
    }
}
