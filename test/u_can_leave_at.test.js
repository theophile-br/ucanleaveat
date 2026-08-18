import { DateTimeUtils } from '../src/shared/date-time-utils.js';
import { UCanLeaveAtModel, OvernightWorkError } from '../src/models/u-can-leave-at-model.js';

import { equal, deepEqual, throws } from 'assert';

const getMinutes = (hours, minutes) => hours * 60 + minutes;
const setNow = (hours, minutes) => { DateTimeUtils.minutesNow = () => getMinutes(hours, minutes); };

const model = new UCanLeaveAtModel();

describe('UCanLeaveAtModel', () => {
    describe('compute()', () => {
        it('returns all fields on the happy path', () => {
            setNow(13, 0);
            const records = [
                { start: getMinutes(9, 0), end: getMinutes(12, 0), type: 'Presence' },
                { start: getMinutes(12, 0), end: getMinutes(12, 30), type: 'Break' },
                { start: getMinutes(12, 30), end: null, type: 'Presence' },
            ];

            const result = model.compute({ records, flexTime: 60, weekPastMinutes: 1000 });

            equal(result.leavingTime, getMinutes(9, 0) + 492 + 30);
            equal(result.breakTime, 0);
            equal(result.todayMinutes, getMinutes(3, 30));
            equal(result.timeToGo, 492 - getMinutes(3, 30));
            equal(result.weekMinutes, 1000 + getMinutes(3, 30));
            equal(result.flextimeForecast, 60 + getMinutes(3, 30) - 492);
        });

        it('weekMinutes falls back to todayMinutes when weekPastMinutes is null', () => {
            setNow(11, 0);
            const records = [{ start: getMinutes(9, 0), end: null, type: 'Presence' }];

            const result = model.compute({ records, flexTime: 0, weekPastMinutes: null });

            equal(result.weekMinutes, getMinutes(2, 0));
        });

        it('flextimeForecast is null when flexTime is null', () => {
            setNow(11, 0);
            const records = [{ start: getMinutes(9, 0), end: null, type: 'Presence' }];

            const result = model.compute({ records, flexTime: null, weekPastMinutes: 0 });

            equal(result.flextimeForecast, null);
        });

        it('throws OvernightWorkError when a record crosses midnight', () => {
            setNow(1, 0);
            const records = [
                { start: getMinutes(23, 0), end: getMinutes(1, 0), type: 'Presence' },
            ];

            throws(() => model.compute({ records }), OvernightWorkError);
        });

        it('throws OvernightWorkError when computed leaving time crosses midnight', () => {
            setNow(23, 30);
            const records = [
                { start: getMinutes(23, 0), end: null, type: 'Presence' },
            ];

            throws(() => model.compute({ records }), OvernightWorkError);
        });
    });

    describe('formatTimeToGo()', () => {
        it('returns null when timeToGo is 0', () => {
            equal(model.formatTimeToGo(0), null);
        });

        it('returns null when timeToGo is null', () => {
            equal(model.formatTimeToGo(null), null);
        });

        it("returns 'to go' with positive minutes when timeToGo is positive", () => {
            deepEqual(model.formatTimeToGo(45), { label: 'to go', minutes: 45 });
        });

        it("returns 'extra time' with absolute minutes when timeToGo is negative", () => {
            deepEqual(model.formatTimeToGo(-45), { label: 'extra time', minutes: 45 });
        });
    });
});
