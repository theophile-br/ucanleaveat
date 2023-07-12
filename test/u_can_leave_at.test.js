import { DateTimeUtils, UCanLeaveAtModel } from '../index.js';

import { equal } from 'assert';

const getMinutes = (hours, minutes) => {
    return hours * 60 + minutes;
}

describe('HowLong', function () {
    describe("getTimeOfLeavingWork()", () => {
        it("When you have one Presence record ", () => {
            DateTimeUtils.minutesNow = () => getMinutes(10, 20)
            const records = [
                {
                    "start": getMinutes(9, 0),
                    "end": null,
                    "type": "Presence"
                }
            ]

            const expectedTimeOfLeavingWork = getMinutes(9, 0) + 492 + 30;

            const howLong = new UCanLeaveAtModel();
            const data = howLong.getTimeOfLeavingWork(records);
            equal(data.time, expectedTimeOfLeavingWork);
            equal(data.breakTime, 30);
        })

        it("When you have one Presence and one Break on going less than 30 min", () => {
            DateTimeUtils.minutesNow = () => getMinutes(10, 20)
            const records = [
                {
                    "start": getMinutes(9, 0),
                    "end": getMinutes(10, 0),
                    "type": "Presence"
                },
                {
                    "start": getMinutes(10, 0),
                    "end": null,
                    "type": "Break"
                }
            ]

            const expectedTimeOfLeavingWork = getMinutes(9, 0) + 492 + 10;

            const howLong = new UCanLeaveAtModel();
            const data = howLong.getTimeOfLeavingWork(records);
            equal(data.time, expectedTimeOfLeavingWork);
            equal(data.breakTime, 10);
        })

        it("When you have one Presence and one Break on going more than 30 min", () => {
            DateTimeUtils.minutesNow = () => getMinutes(10, 50)
            const records = [
                {
                    "start": getMinutes(9, 0),
                    "end": getMinutes(10, 0),
                    "type": "Presence"
                },
                {
                    "start": getMinutes(10, 0),
                    "end": null,
                    "type": "Break"
                }
            ]

            const expectedTimeOfLeavingWork = getMinutes(9, 0) + 492 + 50;

            const howLong = new UCanLeaveAtModel();
            const data = howLong.getTimeOfLeavingWork(records);
            equal(data.time, expectedTimeOfLeavingWork);
            equal(data.breakTime, 0);
        })

        it("When you have two Presence and one Break", () => {
            DateTimeUtils.minutesNow = () => getMinutes(16, 0)
            const records = [
                {
                    "start": getMinutes(9, 15),
                    "end": getMinutes(12, 19),
                    "type": "Presence"
                },
                {
                    "start": getMinutes(12, 19),
                    "end": getMinutes(13, 45),
                    "type": "Break"
                },
                {
                    "start": getMinutes(13, 45),
                    "end": getMinutes(19, 20),
                    "type": "Presence"
                }
            ]

            const expectedTimeOfLeavingWork = getMinutes(18, 53);

            const howLong = new UCanLeaveAtModel();
            const data = howLong.getTimeOfLeavingWork(records);
            equal(data.time, expectedTimeOfLeavingWork);
            equal(data.breakTime, 0);
        })
    })
});
