import { DateTimeUtils } from "../shared/date-time-utils.js";

export class AtossRecord {
    constructor(start, end, type) {
        this.start = start;
        this.end = end;
        this.type = type;
    }

    duration() {
        return this.end ? this.end - this.start : DateTimeUtils.minutesNow() - this.start;
    }
}
