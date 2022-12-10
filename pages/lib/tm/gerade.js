
/*
 * _______________
 * |       .-.   |
 * |      // ``  |
 * |     //      |
 * |  == ===-_.-'|
 * |   //  //    |
 * |__//_________|
 *
 * Copyright (c) ${YEAR} familie-redlich :systeme <systeme@familie-redlich.de>
 * @link     http://www.familie-redlich.de
 *
 *
 */

var helpers = require('../helpers')
var Gerade = function (x1, y1, x2, y2) {
    var that = this;
    this.pos = 0;
    this.step = 1;
    this.m = 0;
    this.b = 0;
    this.x1 = 0;
    this.x2 = 0;
    this.y1 = 0;
    this.y2 = 0;
    this.len = 0;


    this.setM = function (m) {
        that.m = m;
    };

    this.getM = function () {
        return that.m;
    };

    this.setB = function (b) {
        that.b = b;
    };
    this.getB = function () {
        return that.b;
    };


    this.getYVal = function (x) {
        var y = 0;
        y = (that.m * x) + that.b;
        return y;
    };

    this.isOverVal = function (posAsk, value) {
        var functionVal = that.getYVal(posAsk);
        var sigM = Math.signum(that.m);

        var isOver = false;
        switch (sigM) {
            case ( - 1):
                if (functionVal < value) {
                    isOver = true;
                }
                break;
            case (0):
                isOver = "==";
                break;
            case (1):
                if (value > functionVal) {
                    isOver = true;
                }
                break;
        }
        return isOver;
    }

    this.getDeltaX = function () {

        return Math.abs(that.x2 - that.x1);
    };
    this.getDeltaY = function () {
        return (that.x2 - that.x1);
    };

    this.getDeltaY = function () {
        return (that.x2 - that.x1);
    };

    this.getEuclDelta = function () {
        return Math.sqrt((Math.pow(that.x2 - that.x1, 2) + Math.pow(that.y2 - that.y1, 2)));
    };

    this.copy = function () {
        return new gerade(that.m, that.b);
    };

    this.getNext = function (direction) {

        //endless
        // that.pos=that.pos<=-1?that.curve.length:that.pos;
        // that.pos=that.pos>=that.curve.length?-1:that.pos;
        //  alert(that.pos);

        if (direction === 1) {

            that.pos += that.step;

        } else if (direction === -1) {

            that.pos -= that.step;

        }

        // var val=that.curve[that.pos]

        var val = that.getYVal(that.pos);
        //eg val+0/1.. val+1/2 positiv, val-1/2 negativ
        //  console.log(that.spielRaum);
        //val=(val+that.sideCompressor)/that.spielRaum;
        //console.log(that.curve[that.pos]);
        return(val);
    }

    this.init(x1, y1, x2, y2);

};

Gerade.prototype.saveAsHtml = helpers.saveAsGerade;
Gerade.prototype.init = function (x1, y1, x2, y2) {
    this.x1 = x1;
    this.x2 = x2;
    this.y1 = y1;
    this.y2 = y2;
    this.len = x2 - x1;

 console.log('!!!!',x1, y1, x2, y2)
    this.pos = x1;

    var m = (y2 - y1) / (x2 - x1);
    var b = y2 - (x2 * m);

    this.setM(m);
    this.setB(b);
}


module.exports = Gerade

return

var g = new Gerade(-2,-23.2,4,4.333);
g.saveAsHtml();
