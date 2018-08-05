const evaluate = require('./lib/evaluate.js');

const textToTime = function() {
    this._now = new Date().getTime();
    this._timeZone = 'UTC';

    this.timeZone = function(timeZone) {
       this._timeZone = timeZone;
       return this;
    } 

    this.now = function(now) {
        if (now instanceof Date) {
            this._now = now.getTime();
        } else if (typeof now == 'number') {
            this._now = now;
        }

        return this;
    }

    this.evaluate = function(expression, callback) {
        let _now = this._now;
        let _timeZone = this._timeZone;

        evaluate.evaluate(expression, {
            now: _now, 
            timeZone: _timeZone
        }, (err, result) => {
            if (err) {
                callback({
                    message: err.message
                });
            } else {
                callback(undefined, {
                    now: _now,
                    timeZone: _timeZone, 
                    timestamp: result
                });
            }
        });
    }

    return this;
}

module.exports = textToTime;