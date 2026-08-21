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

export function updateUI({ lastUpdate, time, breakTime, flexTime, flextimeForecast, timeToGo, weekMinutes, todayMinutes, chipVisibility, weeklyFlex } = {}) {
    if (lastUpdate != null) {
        const isToday = DateTimeUtils.isToday(lastUpdate);
        $("result-block").style.display = isToday ? "block" : "none";
        $("have-to-update-block").style.display = isToday ? "none" : "block";
        $("last-update").textContent = DateTimeUtils.formatByTimestamp(lastUpdate);
    }

    if (time != null) {
        $("result").textContent = DateTimeUtils.convertMinutesToTime(time);
        $("break").textContent = breakTime > 0 ? `incl. ${breakTime}min break` : "";
    }

    const visible = chipVisibility ?? {};
    const showChip = (id, hasData) => visible[id] !== false && hasData;

    $("flex-chip").style.display = showChip("flex", flexTime != null) ? "" : "none";
    if (flexTime != null) {
        $("flextime").textContent = DateTimeUtils.convertMinutesToTime(flexTime);
    }

    if (flextimeForecast !== undefined) {
        $("forecast-chip").style.display = showChip("forecast", flextimeForecast != null) ? "" : "none";
        if (flextimeForecast != null) {
            $("flextime-forcast-value").textContent = DateTimeUtils.convertMinutesToTime(flextimeForecast);
        }
    }

    if (todayMinutes !== undefined) {
        $("today-metric").style.display = showChip("today", todayMinutes != null) ? "" : "none";
        if (todayMinutes != null) {
            $("today-worked").textContent = DateTimeUtils.convertMinutesToTime(todayMinutes);
        }
    }

    if (weekMinutes !== undefined) {
        $("week-metric").style.display = showChip("week", weekMinutes != null) ? "" : "none";
        if (weekMinutes != null) {
            $("week-progress").textContent = DateTimeUtils.convertMinutesToTime(weekMinutes);
        }
    }

    if (timeToGo !== undefined) {
        const chip = $("time-to-go-chip");
        chip.style.display = showChip("timeToGo", timeToGo != null) ? "" : "none";
        if (timeToGo != null) {
            chip.querySelector(".chip-label").textContent = timeToGo.label === "extra time" ? "Extra" : "To go";
            $("time-to-go").textContent = DateTimeUtils.convertMinutesToTime(timeToGo.minutes);
        }
    }

    if (weeklyFlex !== undefined) {
        $("weekly-flex-chip").style.display = showChip("weeklyFlex", flextimeForecast != null) ? "" : "none";
        if (weeklyFlex != null) {
            $("weekly-flex-value").textContent = DateTimeUtils.convertMinutesToTime(weeklyFlex);
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

export function setChipVisibilityValue(config) {
    document.querySelectorAll(".mini-chip").forEach(el => {
        const id = el.dataset.chip;
        el.classList.toggle("is-off", config?.[id] === false);
    });
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
