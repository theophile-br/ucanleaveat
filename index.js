/**
 * Some part of cause from https://github.com/philippecade/howlong was reused
 * 
 */

const ERecordType = {
    BREAK: "Break",
    PRESENCE: "Presence",
    HOME_OFFICE: "Home Office hourly",
}

export class DateTimeUtils {
    static now = () => new Date();
    static minutesNow = () => DateTimeUtils.convertDateToMinutes(new Date())

    static isToday(timeStamp) {
        const date = new Date();
        date.setTime(timeStamp);
        const refDate = this.now();
        const sameDate = date.getDay() == refDate.getDay();
        const sameNumber = date.getDate() == refDate.getDate();
        const sameMonth = date.getMonth() == refDate.getMonth();
        const sameYear = date.getFullYear() == refDate.getFullYear();
        return sameDate && sameNumber && sameMonth && sameYear;
    }

    static isYesterday(timeStamp) {
        const date = new Date();
        date.setTime(timeStamp);
        const yesterday = this.now();
        yesterday.setDate(yesterday.getDate() - 1);

        return date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear();
    }

    static formatDate(date) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        const day = dayNames[date.getDay()];
        const dateNumber = date.getDate();
        const month = monthNames[date.getMonth()];

        return `${day} ${dateNumber} ${month}`
    }

    static formatByDate(date) {
        const fDate = this.formatDate(date);
        const fHour = this.convertDateToTime(date);

        return `${fDate} at ${fHour}`
    }

    static formatByTimestamp(timestamp) {
        const date = new Date();
        date.setTime(timestamp);
        return this.formatByDate(date);
    }

    // Convert Date Object to Time eg. 01:32
    static convertDateToTime(date) {
        const pad = (num) => {
            return ('00' + num).substr(-2);
        }
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${pad(hours)}:${pad(minutes)}`;
    }

    // Convert Minutes to Time format (e.g., 120 to "02:00" or -75 to "-01:15")
    static convertMinutesToTime(minutes) {
        const isNegative = minutes < 0;
        const absoluteMinutes = Math.abs(minutes);
    
        const hours = Math.floor(absoluteMinutes / 60);
        const remainingMinutes = absoluteMinutes % 60;
    
        const hoursString = String(hours).padStart(2, '0');
        const minutesString = String(remainingMinutes).padStart(2, '0');
    
        return (isNegative ? '-' : '') + `${hoursString}:${minutesString}`;
    }

    // Convert Date to Minutes
    static convertDateToMinutes(date) {
        return date.getHours() * 60 + date.getMinutes()
    }

    //Convert Minutes to Time eg. 02:00 to 120
    static convertTimeToMinutes(time) {
        var isNegative = false
        if (time[0] == "-") {
            isNegative = true
            time = time.substring(1)
        }
        const [hoursString, minutesString] = time.split(':');
        const hours = parseInt(hoursString);
        const minutes = parseInt(minutesString);

        if (isNaN(hours) || isNaN(minutes)) {
            console.error("Erreur de parsing : format de temps invalide");
            return NaN;
        }

        const totalMinutes = hours * 60 + minutes;
        return isNegative ? -totalMinutes : totalMinutes;
    }

}

export class AtossRecord {
    start;
    end;
    type;

    constructor(start, end, type) {
        this.start = start;
        this.end = end;
        this.type = type;
    };

    duration() {
        return this.end ? this.end - this.start : DateTimeUtils.minutesNow() - this.start;
    }
}

export class UCanLeaveAtModel {
    mandatoryBreakTime = 30 // min
    fullWorkTime = 492; // min (8 hours 12 minutes)

    getTimeOfLeavingWork(records, percentageOfWorkTimes = 100) {
        const recordsModel = records.map(e => new AtossRecord(e.start, e.end, e.type))
        percentageOfWorkTimes /= 100;
        const clockInTime = recordsModel.find(e => e.type == ERecordType.PRESENCE || e.type == ERecordType.HOME_OFFICE).start ?? null;

        const amoutOfBreakTime = recordsModel.filter(e => e.type == ERecordType.BREAK).reduce((a, b) => a + b.duration(), 0);

        const remaingMandatoryBreakTime = amoutOfBreakTime >= this.mandatoryBreakTime ? 0 : this.mandatoryBreakTime - amoutOfBreakTime;

        const exceedAmoutOfBreakTime = amoutOfBreakTime >= this.mandatoryBreakTime ? Math.abs(this.mandatoryBreakTime - amoutOfBreakTime) : 0;

        const realFullWorkTime = Math.ceil(this.fullWorkTime * percentageOfWorkTimes);

        return {
            time: clockInTime + realFullWorkTime + exceedAmoutOfBreakTime + this.mandatoryBreakTime, // in min
            breakTime: remaingMandatoryBreakTime, // in min
        }

    }

    getFlextimeForcast(flexTime, breakTime, timeUCanLeaveAt, dateTime) {
        const dateTimeInMinutes = DateTimeUtils.convertTimeToMinutes(dateTime)
        return flexTime + dateTimeInMinutes - timeUCanLeaveAt;
    }

}

class AtossAPI {

    async getData() {
        const r = await Promise.all([this.getFlexTime(), this.getTimeRecords()]);
        if (r[0]) {
            return {
                flextime: DateTimeUtils.convertTimeToMinutes(r[0]),
                records: r[1]
            };
        }
        return null;
    }

    async getTimeRecords() {
        return new Promise((resolve, reject) => chrome.tabs.query({ active: true }, function (tabs) {
            const tab = tabs.find((t) => t.url.includes("ases.swiss-as.com"));
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: searchTimeIntervalElements
            }, (r) =>
                resolve(r ? r[0]?.result : null)
            );
        }));

        function searchTimeIntervalElements() {
            const iframe = document.getElementById("applicationIframe")
            if (!iframe) {
                return null;
            }
            const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
            const timeIntervalElementsInIframe = innerDoc.getElementsByClassName("time-interval-wrapper");

            const timeIntervalElements = timeIntervalElementsInIframe.length = 0 ? document.body.getElementsByClassName("time-interval-wrapper") : timeIntervalElementsInIframe;

            if (timeIntervalElements.length = 0) {
                return null
            }
            const records = Array.from(timeIntervalElements).map(v => {
                const fromTimeAttr = v.getAttribute("data_fromtime")
                const totimeAttr = v.getAttribute("data_totime")

                const start = fromTimeAttr ? parseInt(fromTimeAttr) : null
                var end = totimeAttr ? parseInt(totimeAttr) : null
                if (end == 29952) {
                    end = null;
                }
                const type = v.getElementsByClassName('input-search-wrapper')[0]?.getElementsByClassName("searcher")[0]?.value;
                return {
                    start: start,
                    end: end,
                    type: type
                }
            })
            return records.length > 0 ? records : null;
        };
    }

    async getFlexTime() {
        return new Promise((resolve, reject) => chrome.tabs.query({ active: true }, function (tabs) {
            const tab = tabs.find((t) => t.url.includes("ases.swiss-as.com"));
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: searchFlexTime
            }, (r) =>
                resolve(r ? r[0]?.result : null)
            );
        }));

        function searchFlexTime() {
            const iframe = document.getElementById("applicationIframe")
            if (!iframe) {
                return null;
            }
            const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
            const flexTime = Array.from(innerDoc.querySelectorAll(".data-list-body-cell-wrapper")).filter(e => e.innerHTML.includes("Flex"))[0]?.querySelectorAll(".caption")[1]?.textContent;
            return flexTime.replace(/\u200B/g, ''); // Replace zero-width space between the - and the number if needed
        };
    }

    async clickOnTimeRecordingManualy() {
        await new Promise((resolve, reject) => chrome.tabs.query({ active: true }, function (tabs) {
            const tab = tabs.find((t) => t.url.includes("ases.swiss-as.com"));
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: getTimeRecordManualyButton
            });
        }));

        function getTimeRecordManualyButton() {
            const iframe = document.getElementById("applicationIframe")
            if (!iframe) {
                return null;
            }
            const innerDoc = iframe.contentDocument || iframe.contentWindow.document || document.body;
            const buttons = Array.from(innerDoc.querySelectorAll(".action-item")).filter(e => e.innerHTML.includes("glyphicon glyphicon-time"))
            if (buttons.length == 0) {
                reject()
            }
            buttons[0].click()
            resolve()
        };
    }
}

const main = async () => {
    // Setup global
    const howLong = new UCanLeaveAtModel()

    // Setup UI
    const flextimeForcastTimeController = document.getElementById("flextime-forcast-time");
    const flextimeForcastResultUI = document.getElementById("flextime-forcast-value");
    const updateBtn = document.getElementById("update")
    const resultUI = document.getElementById("result")
    const lastUpdateUI = document.getElementById("last-update")
    const flextimeUI = document.getElementById("flextime")
    const breakUI = document.getElementById("break")
    const workRateUI = document.getElementById("work-rate");
    const resultBlock = document.getElementById("result-block");
    const haveToUpdateBlock = document.getElementById("have-to-update-block");

    const updateUI = (lastUpdate, time, breakTime, flexTime, flextimeForcastValue) => {
        if (lastUpdate) {
            if (!DateTimeUtils.isToday(lastUpdate)) {
                resultBlock.style.display = "none"
                haveToUpdateBlock.style.display = "block"
            } else {
                resultBlock.style.display = "block"
                haveToUpdateBlock.style.display = "none"
            }
            lastUpdateUI.textContent = DateTimeUtils.formatByTimestamp(lastUpdate)
        }
        if (flexTime) {
            flextimeUI.textContent = DateTimeUtils.convertMinutesToTime(flexTime);
        }
        if (time) {
            resultUI.innerHTML = `<strong>${DateTimeUtils.convertMinutesToTime(time)}</strong>`
            if (breakTime && breakTime > 0) {
                breakUI.innerHTML = `<span class="info"> ( including ${breakTime} minutes of break time )</span>`
            } else {
                breakUI.innerHTML = ``
            }
        }
        if (flextimeForcastValue) {
            flextimeForcastResultUI.textContent = DateTimeUtils.convertMinutesToTime(flextimeForcastValue);
            // flextimeForcastResultUI.style.display = "block"
        }
    }

    workRateUI.addEventListener("change", (event) => {
        const value = event.target.value;
        chrome.storage.local.set({ workRate: value })
        chrome.storage.local.get(["records"]).then((result) => {
            if (result.records) {
                const records = result.records;
                const { time, breakTime } = howLong.getTimeOfLeavingWork(records, parseInt(workRateUI.value))
                updateUI(null, time, breakTime)
                chrome.storage.local.set({ time: time, breakTime: breakTime })
            }
        });
    })

    flextimeForcastTimeController.addEventListener("change", (event) => {
        const value = event.target.value;
        chrome.storage.local.get(["time", "flexTime", "breakTime"]).then((result) => {
            const flextimeForcast = howLong.getFlextimeForcast(result.flexTime, result.breakTime, result.time, value);
            updateUI(null, null, null, null, flextimeForcast);
        });
    });

    // no keyboard
    workRateUI.addEventListener("keydown", e => e.preventDefault());

    updateBtn.addEventListener("click", async () => {
        const atossApi = new AtossAPI()
        const { flextime, records } = await atossApi.getData();
        if (records) {
            const { time, breakTime } = howLong.getTimeOfLeavingWork(records, parseInt(workRateUI.value))
            const lastUpdateTimestamp = new Date().getTime();
            updateUI(lastUpdateTimestamp, time, breakTime, flextime)
            chrome.storage.local.set({ lastUpdate: lastUpdateTimestamp, time: time, flexTime: flextime, breakTime: breakTime, records: records })
        }
    })

    workRateUI.addEventListener("change", (event) => {
        const value = event.target.value;
        chrome.storage.local.set({ workRate: value })
        chrome.storage.local.get(["records"]).then((result) => {
            if (result.records) {
                const records = result.records;
                const { time, breakTime } = howLong.getTimeOfLeavingWork(records, parseInt(workRateUI.value))
                updateUI(null, time, breakTime)
                chrome.storage.local.set({ time: time, breakTime: breakTime })
            }
        });
    })

    //Gathering Data
    chrome.storage.local.get(["lastUpdate", "time", "flexTime", "workRate", "breakTime", "records"]).then((result) => {
        console.log("local storage")
        console.log(result)
        updateUI(result.lastUpdate, result.time, result.breakTime, result.flexTime)
        if (result.time && result.breakTime != null) {
            const { time, breakTime } = howLong.getTimeOfLeavingWork(result.records, parseInt(workRateUI.value))
            const lastUpdateTimestamp = new Date().getTime();
            updateUI(lastUpdateTimestamp, time, breakTime, result.flexTime)
            chrome.storage.local.set({ lastUpdate: lastUpdateTimestamp, time: time, breakTime: breakTime })

            const now = DateTimeUtils.convertDateToTime(new Date());
            flextimeForcastTimeController.value = now;
            const flextimeForcast = howLong.getFlextimeForcast(result.flexTime, result.breakTime, time, now);
            updateUI(null, null, null, null, flextimeForcast);
        }
        workRateUI.value = result.workRate ?? 100;

    });


}

main()
