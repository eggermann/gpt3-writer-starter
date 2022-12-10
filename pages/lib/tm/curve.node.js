if (global)
    window = global;


var _ = {
    fix: function (val) {

        val = val.toFixed(6);
        val = parseFloat(val);

        return val;
    },
    transform: function (val) {


        return val === 0 ? 1 : 0;
    },
    checkHighest: function (val) {
        if (val > this.highest) {
            this.highest = val;
        }
    }
};


var curve = (function (window, undefined) {

    var Curve = function () {
        var oldLen = this.len;
        var oldFactor = 1;
        var _viewer;
        var that = this;
        this.curves = [];


        this.newCurve = function (len, periode, amplitude, type) {
            var c = new this.curve(len, periode, amplitude, type);
            this.curves.push(c);

            return c;
        }

        this.pitch = function (factor) {
            /*reset*/
            if (factor === -1) {
                that.pos = that.pos / oldFactor;
                that.len = oldLen;
                return;
            }

            oldFactor = factor;
            that.pos *= factor;
            that.len *= factor;
        };
        /*TODO:set up to taktmusterCurve*/
        this.merge = function (curveArr, metrom) {

            console.log('++', curveArr)
            var len = Math.max.apply(Math, curveArr.map(function (o) {

                return o.len;
            }))

            var newMixCurve = new that.curve(len);
            newMixCurve.getNext = null;

            newMixCurve.getNextFromCurves = curveArr.map(function (item) {
                //   console.log(item)
                return item.getNext;
            });
//overwrite fkt

            var step = newMixCurve.step;

            newMixCurve.getNext = function (direction) {
                var obj = {};
                that.pos = -1;
                // console.log(' ')
                newMixCurve.getNextFromCurves.forEach(function (getNext) {
                    var val = getNext(direction);

                    obj.curveSum = obj.curveSum
                        ? obj.curveSum + val.curveSum
                        : obj.curveSum = val.curveSum;

                 //   console.log('  obj.curveSum', obj.curveSum)


                    obj.taktVal = obj.taktVal
                        ? obj.taktVal + val.taktVal
                        : obj.taktVal = val.taktVal;


                    //  return obj;
                });

                if (newMixCurve.scaleMode) {
                    obj.curveSum /= curveArr.length;

                    //    console.log('scaleMode', obj.curveSum)
                    // obj.taktVal /= curveArr.length;
                }

                direction = direction ? direction : 1;

                newMixCurve.pos +=
                    step * direction;

                if ((newMixCurve.pos % len) === 0) {
                    obj.newCycle = true;
                }


                return obj;
            };

            newMixCurve.partialCount = curveArr.length;

            return newMixCurve;
        };

        this.curve = function (len, periode, amplitude, type) {
            var that = this;

            this.len = len = len ? len : 100;
            this.amplitude = amplitude ? amplitude : 1;
            this.periode = periode ? periode : 1;
            this.type = type = type ? type : "normal";

            this.sideCompressor = 0;//(+/- level)
            this.spielRaum = 1;//(muss gröser sein_stärke bestimmt )

            this.highest = -1000;
            this.pos = -1;
            this.step = 1;


            //this.saveAsHtml = helpers.saveAsHtml;

            this.scaleMode = false;//if its a mered curve scale It
            this.partialCount = 1;//if its a mered curve scale It

            this.list = function () {
                return that.curve.join(',')
            }

            this.show = function () {
                _viewer.showCurve(this);
            }

            this.getNext = function (direction) {
                direction = direction ? direction : 1;

                //  alert(that.pos);
                that.pos += that.step * direction;
                // console.log('pos:   ', that.pos, that.periode)
                // var val=that.curve[that.pos]


                var val = that.renderFunctions[that.type](that.pos);


                //eg val+0/1.. val+1/2 positiv, val-1/2 negativ
                //  console.log(that.spielRaum);
                val = (val + that.sideCompressor) / that.spielRaum;

                var obj = {};
                obj.curveSum = _.fix(val);
                obj.taktVal = _.transform(obj.curveSum)

                return obj;
            };

            this.renderFunctions = {

                'cos': function (pos) {
                    var fact = 1;//dosen´t matter
                    var scale = fact / len;
                    var posA = pos * scale;
//https://gist.github.com/gkhays/e264009c0832c73d5345847e673a64ab
                    var sin = Math.cos(that.periode * Math.PI * posA / fact);

                    var val = sin * that.amplitude;
                    //  val = sin;//;


                    _.checkHighest.call(this, val);

                    return (val);
                },
                'sin': function (pos) {
                    var fact = 1;//dosen´t matter
                    var scale = fact / len;
                    var posA = pos * scale;
//https://gist.github.com/gkhays/e264009c0832c73d5345847e673a64ab
                    var sin = Math.sin(that.periode * Math.PI * posA / fact);

                    var val = sin * that.amplitude;
                    //  val = sin;//;

                    _.checkHighest.call(this, val);

                    return (val);
                }
            };
        };

    };

    return new Curve();
})(window, undefined);

module.exports = curve;


