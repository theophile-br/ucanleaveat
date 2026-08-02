import { AtossRecord } from "./atoss-record.js";
import { isBreak, isWork } from "../shared/constants.js";
import { DateTimeUtils } from "../shared/date-time-utils.js";

export class UCanLeaveAtModel {
    mandatoryBreakTime = 30;
    fullWorkTime = 492;

    getTimeOfLeavingWork(records, percentageOfWorkTimes = 100) {
        const recordsModel = records.map(e => new AtossRecord(e.start, e.end, e.type));
        const rate = percentageOfWorkTimes / 100;

        const clockIn = recordsModel.find(e => isWork(e.type));
        const clockInTime = clockIn ? clockIn.start : null;

        const totalBreak = recordsModel
            .filter(e => isBreak(e.type))
            .reduce((a, b) => a + b.duration(), 0);

        const remainingMandatoryBreak = totalBreak >= this.mandatoryBreakTime
            ? 0
            : this.mandatoryBreakTime - totalBreak;

        const exceededBreak = totalBreak >= this.mandatoryBreakTime
            ? Math.abs(this.mandatoryBreakTime - totalBreak)
            : 0;

        const realFullWorkTime = Math.ceil(this.fullWorkTime * rate);

        return {
            time: clockInTime + realFullWorkTime + exceededBreak + this.mandatoryBreakTime,
            breakTime: remainingMandatoryBreak,
        };
    }

    getFlextimeForcast(flexTime, breakTime, timeUCanLeaveAt, dateTime) {
        const dateTimeInMinutes = DateTimeUtils.convertTimeToMinutes(dateTime);
        return flexTime + dateTimeInMinutes - timeUCanLeaveAt;
    }
}
