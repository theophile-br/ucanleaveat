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

export function updateUI({ lastUpdate, time, breakTime, flexTime, flextimeForecast } = {}) {
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
        $("result").innerHTML = `<strong>${DateTimeUtils.convertMinutesToTime(time)}</strong>`;
        $("break").innerHTML = breakTime > 0
            ? `<span class="info"> ( including ${breakTime} minutes of break time )</span>`
            : "";
    }

    if (flextimeForecast != null) {
        $("flextime-forcast-value").textContent = DateTimeUtils.convertMinutesToTime(flextimeForecast);
    }
}

export function setWorkRateValue(value) {
    $("work-rate").value = value;
}

export function setForecastTime(value) {
    $("flextime-forcast-time").value = value;
}
