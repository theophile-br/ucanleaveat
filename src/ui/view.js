import { DateTimeUtils } from "../shared/date-time-utils.js";

const $ = (id) => document.getElementById(id);

export function setLoading(isLoading) {
    $("loading").style.display = isLoading ? "block" : "none";
    if (isLoading) $("error").style.display = "none";
}

export function setError(message) {
    $("error").style.display = "block";
    $("error-message").textContent = message;
    $("loading").style.display = "none";
}

export function clearError() {
    $("error").style.display = "none";
}

export function setOnAtoss(isOnAtoss) {
    $("update").disabled = !isOnAtoss;
}

export function updateUI({ lastUpdate, time, breakTime, flexTime, flextimeForecast, timeToGo, weekMinutes, todayMinutes } = {}) {
    if (lastUpdate != null) {
        const isToday = DateTimeUtils.isToday(lastUpdate);
        $("result-block").style.display = isToday ? "block" : "none";
        $("have-to-update-block").style.display = isToday ? "none" : "block";
        $("last-update").textContent = DateTimeUtils.formatByTimestamp(lastUpdate);
    }

    if (flexTime != null) {
        $("flextime").textContent = DateTimeUtils.convertMinutesToTime(flexTime);
    }

    if (time != null) {
        $("result").textContent = DateTimeUtils.convertMinutesToTime(time);
        $("break").textContent = breakTime > 0 ? `including ${breakTime} min break` : "";
    }

    if (flextimeForecast != null) {
        $("flextime-forcast-value").textContent = DateTimeUtils.convertMinutesToTime(flextimeForecast);
    }

    if (todayMinutes !== undefined) {
        const wrap = $("today-metric");
        if (todayMinutes == null) {
            wrap.style.display = "none";
        } else {
            wrap.style.display = "";
            $("today-worked").textContent = DateTimeUtils.convertMinutesToTime(todayMinutes);
        }
    }

    if (weekMinutes !== undefined) {
        const wrap = $("week-metric");
        if (weekMinutes == null) {
            wrap.style.display = "none";
        } else {
            wrap.style.display = "";
            $("week-progress").textContent = DateTimeUtils.convertMinutesToTime(weekMinutes);
        }
    }

    if (timeToGo !== undefined) {
        const el = $("time-to-go");
        if (timeToGo == null) {
            el.style.display = "none";
        } else {
            el.style.display = "inline-block";
            el.innerHTML = `<strong>${DateTimeUtils.convertMinutesToTime(timeToGo.minutes)}</strong> <span class="info">${timeToGo.label}</span>`;
        }
    }
}

export function setWorkRateValue(value) {
    $("work-rate").value = value;
}

export function setFullWorkTimeValue(minutes) {
    $("full-work-time").value = DateTimeUtils.convertMinutesToTime(minutes);
}

export function setMandatoryBreakValue(minutes) {
    $("mandatory-break").value = DateTimeUtils.convertMinutesToTime(minutes);
}

export function setTheme(theme) {
    for (const cls of Array.from(document.body.classList)) {
        if (cls.startsWith("theme-")) document.body.classList.remove(cls);
    }
    document.body.classList.add(`theme-${theme}`);
}

export function setActiveSwatch(theme) {
    document.querySelectorAll(".swatch").forEach(el => {
        el.classList.toggle("is-selected", el.dataset.theme === theme);
    });
}

export function setEmploymentPreview(minutes) {
    const el = $("work-rate-preview");
    if (minutes == null) {
        el.style.display = "none";
        el.textContent = "";
    } else {
        el.style.display = "";
        el.textContent = `${DateTimeUtils.convertMinutesToTime(minutes)} per day`;
    }
}
