import { DateTimeUtils } from "../shared/date-time-utils.js";

const BREAK_LABELS = ["break", "pause"];
const PRESENCE_LABELS = ["presence", "anwesenheit"];

const norm = (t) => (t ?? "").toString().toLowerCase().trim();

export class AtossRecord {
    constructor(start, end, type) {
        this.start = start;
        this.end = end;
        this.type = type;
    }

    static from(raw) {
        return new AtossRecord(raw.start, raw.end, raw.type);
    }

    duration() {
        return this.end ? this.end - this.start : DateTimeUtils.minutesNow() - this.start;
    }

    isBreak() {
        return BREAK_LABELS.includes(norm(this.type));
    }

    isPresence() {
        return PRESENCE_LABELS.includes(norm(this.type));
    }

    isHomeOffice() {
        const t = norm(this.type);
        return t.includes("home office") || t.includes("home-office") || t.includes("homeoffice");
    }

    isWork() {
        return this.isPresence() || this.isHomeOffice();
    }

    crossesMidnight() {
        return this.start != null && this.end != null && this.start > this.end;
    }
}
