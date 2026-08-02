export class DateTimeUtils {
    static now = () => new Date();
    static minutesNow = () => DateTimeUtils.convertDateToMinutes(new Date());

    static isToday(timeStamp) {
        const date = new Date();
        date.setTime(timeStamp);
        const refDate = this.now();
        return date.getDate() === refDate.getDate() &&
            date.getMonth() === refDate.getMonth() &&
            date.getFullYear() === refDate.getFullYear();
    }

    static formatDate(date) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]}`;
    }

    static formatByDate(date) {
        return `${this.formatDate(date)} at ${this.convertDateToTime(date)}`;
    }

    static formatByTimestamp(timestamp) {
        const date = new Date();
        date.setTime(timestamp);
        return this.formatByDate(date);
    }

    static convertDateToTime(date) {
        const pad = (num) => ('00' + num).substr(-2);
        return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    static convertMinutesToTime(minutes) {
        const isNegative = minutes < 0;
        const abs = Math.abs(minutes);
        const hours = Math.floor(abs / 60);
        const rem = abs % 60;
        return (isNegative ? '-' : '') + `${String(hours).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
    }

    static convertDateToMinutes(date) {
        return date.getHours() * 60 + date.getMinutes();
    }

    static convertTimeToMinutes(time) {
        let isNegative = false;
        if (time[0] === "-") {
            isNegative = true;
            time = time.substring(1);
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
