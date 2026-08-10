import { AtossRecord } from "./atoss-record.js";
import { isBreak, isWork, DEFAULT_FULL_WORK_TIME_MINUTES, DEFAULT_MANDATORY_BREAK_MINUTES } from "../shared/constants.js";
import { DateTimeUtils } from "../shared/date-time-utils.js";

export class UCanLeaveAtModel {
    mandatoryBreakTime = DEFAULT_MANDATORY_BREAK_MINUTES;
    fullWorkTime = DEFAULT_FULL_WORK_TIME_MINUTES;

    getTimeOfLeavingWork(records, percentageOfWorkTimes = 100, fullWorkTime = this.fullWorkTime, mandatoryBreakTime = this.mandatoryBreakTime) {
        const recordsModel = records.map(e => new AtossRecord(e.start, e.end, e.type));
        const rate = percentageOfWorkTimes / 100;

        const clockIn = recordsModel.find(e => isWork(e.type));
        const clockInTime = clockIn ? clockIn.start : null;

        const totalBreak = recordsModel
            .filter(e => isBreak(e.type))
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

    getFlextimeForcast(flexTime, breakTime, timeUCanLeaveAt, dateTime) {
        const dateTimeInMinutes = DateTimeUtils.convertTimeToMinutes(dateTime);
        return flexTime + dateTimeInMinutes - timeUCanLeaveAt;
    }
}
