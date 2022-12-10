const _curve = require('./curve.node');
const tempo = 60;//
var ppq = 1;//pulsPerQuarter
var Metrom = require('./Metrum');
var _metrom = new Metrom(tempo, ppq);
//for draw:
//https://stackoverflow.com/questions/7054272/how-to-draw-smooth-curve-through-n-points-using-javascript-html5-canvas
//https://www.youtube.com/watch?v=ZoUU-EsN1Ck
//https://www.musiker-board.de/threads/8-4-takt.391128/
//https://music.stackexchange.com/questions/24142/tempo-time-signature-and-note-lengths
var tmCurve = {

//TODO 8ung nenner/zähler falsch
    mixFinal: function (taktCnt, zaehler, nenner, curveType) {
        var curves = [];

        var xtelPerBeat = zaehler * taktCnt;
        /*  var fakt = zaehler / nenner
          console.log('fakt', fakt)
  */
        // var bruchinterpolation = 1.333*_metrom.pulsePerQuarter *_metrom.pulsePerQuarterInMilli;//_metrom.pulsePerQuarterInMilli ;//(60000 / _metrom.tempo );//(60000 / _metrom.tempo * 4) / fakt //var quarterInMilli = 60000 / tempo nenner;//

        var totalCurveLength = xtelPerBeat * ((_metrom.pulsePerQuarter * 4) / nenner);// bruchinterpolation;//scale to 1000 milis per takt


        console.log('takt-schläge : ', taktCnt)
        var _sign = "sin"
        var anzWellen = taktCnt * nenner;

        console.log('anzWellen : ', anzWellen)
        this.highest = anzWellen;

        const curvesc = [...Array(anzWellen)].map((i, index) => {
            let c2 = null;

            switch (curveType) {
                case('toggle'):
                    return _curve.newCurve(totalCurveLength, index, 1, _sign);
                    _sign = "sin" === _sign ? "cos" : "sin";
                    break;
                case('cos'):
                    return _curve.newCurve(totalCurveLength, index, 1, 'cos');
                    break;
                default:
                    return _curve.newCurve(totalCurveLength, index + 1, 1, 'sin');
            }
        });

        var mixCurve = _curve.merge(curvesc, _metrom);
        //#set the mixed curve and show
        //->metrom.setTimline(mixcurve)--> modulostep ppq/bpm/qpbpm
        //viellt ppq statisch bei 3-> 96 resp 4->128
        //   tmCurve.showInPureConsole(mixCurve);


        mixCurve.taktCnt = taktCnt;
        mixCurve.zaehler = zaehler;
        mixCurve.nenner = nenner;
        mixCurve.curveType = curveType;

        return mixCurve;
    },
    mixFinalClassic: function (taktCnt, zaehler, nenner, type) {
        var curves = [];
        var taktLen = zaehler * taktCnt;
        var fakt = zaehler / nenner


        console.log('fakt', fakt)

        // var bruchinterpolation = 1.333*_metrom.pulsePerQuarter *_metrom.pulsePerQuarterInMilli;//_metrom.pulsePerQuarterInMilli ;//(60000 / _metrom.tempo );//(60000 / _metrom.tempo * 4) / fakt //var quarterInMilli = 60000 / tempo nenner;//

        var totalCurveLength = taktLen * _metrom.pulsePerQuarter;// bruchinterpolation;//scale to 1000 milis per takt
        var totalTaktength = zaehler * _metrom.pulsePerQuarter;// bruchinterpolation;//scale to 1000 milis per takt

        console.log('**** totalCurveLength  :' + totalCurveLength)


        console.log('takt-schläge : ', taktLen)

        var anzWellen = taktLen;
        //var quotient =(  zaehler+  nenner)/4;//4/8

        // console.log('quotient:  ', quotient)

//sehr gut bei
        var basis = (zaehler) % 2 === 0 ? Math.max(zaehler / 4, 2) : Math.max(zaehler / 4, 3);
        //var basis = (zaehler + nenner) % 2 === 0 ? Math.max((nenner / 2), 2) : 3;
        // real diff in cluster .var  basis =  zaehler % 2 === 0 ?  zaehler : Math.max( zaehler / 2, 2);
        console.log('--', taktCnt + ' * ' + zaehler + '/' + nenner + ' takt , basis: ', basis);
        // x = Math.max(2 - x, 1);
        var i = 0;
        // i = quotient;
        var _sign = "sin"
        while (anzWellen > 1) {
            // var pow = Math.pow( zaehler,i)/x;
            var pow = Math.pow(basis, i);

            // console.log('pow ' + pow, '/i' + i)
            // pow = Math.floor(pow)
            // pow = Math.round(pow)
            var anzWellen = (taktLen) / pow;
            //anzWellen = anzWellen /x;

            //   anzWellen = Math.floor(anzWellen)
            // console.log(anzWellen + '- wellen im viertel');//sequenzen


            anzWellen *= nenner / 4;
            //  console.log(anzWellen + '- wellen im xtel' + nenner);//sequenzen
            //  console.log('curvetype:', type);//sequenzen

            switch (type) {
                case('toggle'):
                    c2 = _curve.newCurve(totalCurveLength, anzWellen, 1, _sign);
                    _sign = "sin" === _sign ? "cos" : "sin";
                    break;
                case('cos'):
                    c2 = _curve.newCurve(totalCurveLength, anzWellen, 1, 'cos');
                    break;
                default:
                    c2 = _curve.newCurve(totalCurveLength, anzWellen, 1, 'sin');

            }

            curves.push(c2);
//if(i==1)break
            i++;
        }

        if (zaehler < nenner) {
            console.log(' zaehler < nenner')
        }

        //  tmCurve.showInConsole(curves);
        var mixCurve = _curve.merge(curves, _metrom, zaehler);
        //#set the mixed curve and show
        //->metrom.setTimline(mixcurve)--> modulostep ppq/bpm/qpbpm
        //viellt ppq statisch bei 3-> 96 resp 4->128
        //   tmCurve.showInPureConsole(mixCurve);


        mixCurve.taktCnt = taktCnt;
        mixCurve.zaehler = zaehler;
        mixCurve.nenner = nenner;
        mixCurve.type = type;

        return mixCurve;
    },

    mixFinalClassicXX: function (taktCnt, zaehler, nenner, type) {
        var curves = [];
        //var quotient =(  zaehler+  nenner)/4;//4/8

        // console.log('quotient:  ', quotient)
        var _sign = "sin"
        var anzWellen = taktCnt * zaehler;

        var xtelPerBeat = zaehler;
        var totalCurveLength = ((taktCnt * ((zaehler))))
        console.log('totalCurveLength', totalCurveLength)
        ;// bruchinterpolation;//scale to 1000 milis per takt


        console.log('anzWellen : ', anzWellen)
//sehr gut bei
        var basis = (zaehler) % 2 === 0 ? Math.max(zaehler / 4, 2) : Math.max(zaehler / 4, 3);
        //var basis = (zaehler + nenner) % 2 === 0 ? Math.max((nenner / 2), 2) : 3;
        // real diff in cluster .var  basis =  zaehler % 2 === 0 ?  zaehler : Math.max( zaehler / 2, 2);
        console.log('--', taktCnt + ' * ' + zaehler + '/' + nenner + ' takt , basis: ', basis);
        // x = Math.max(2 - x, 1);
        var i = 0;
        // i = quotient;
        var _sign = "sin"
        while (anzWellen > 1) {
            // var pow = Math.pow( zaehler,i)/x;
            var pow = Math.pow(basis, i);

            // console.log('pow ' + pow, '/i' + i)
            // pow = Math.floor(pow)
            // pow = Math.round(pow)
            var anzWellen = (taktCnt) / pow;
            //anzWellen = anzWellen /x;

            //   anzWellen = Math.floor(anzWellen)
            // console.log(anzWellen + '- wellen im viertel');//sequenzen


            // anzWellen *= ( (4 )) ;
            //  console.log(anzWellen + '- wellen im xtel' + nenner);//sequenzen
            //  console.log('curvetype:', type);//sequenzen

            switch (type) {
                case('toggle'):
                    c2 = _curve.newCurve(totalCurveLength, anzWellen, 1, _sign);
                    _sign = "sin" === _sign ? "cos" : "sin";
                    break;
                case('cos'):
                    c2 = _curve.newCurve(totalCurveLength, anzWellen, 1, 'cos');
                    break;
                default:
                    c2 = _curve.newCurve(totalCurveLength, anzWellen, 1, 'sin');

            }

            curves.push(c2);
//if(i==1)break
            i++;
        }

        if (zaehler < nenner) {
            console.log(' zaehler < nenner')
        }

        //  tmCurve.showInConsole(curves);
        var mixCurve = _curve.merge(curves, _metrom);
        //#set the mixed curve and show
        //->metrom.setTimline(mixcurve)--> modulostep ppq/bpm/qpbpm
        //viellt ppq statisch bei 3-> 96 resp 4->128
        //   tmCurve.showInPureConsole(mixCurve);


        mixCurve.taktCnt = taktCnt;
        mixCurve.zaehler = zaehler;
        mixCurve.nenner = nenner;
        mixCurve.type = type;
        mixCurve.len = zaehler * taktCnt * _metrom.pulsePerQuarter;

        return mixCurve;
    },

    showInPureConsole: function (mixCurve) {
        console.log('##', mixCurve.len)
        /*                var val = c1._curve[i];// == 0 ? 1 : 0;
         val = _.transform(val);
         console.log(i + 1, ':', val)*/
        var taktString = '',
            curveSring = '',
            curveSum = 0;
        var cnt = 0;
        var taktStringArr = []
        for (var i = 0; i < mixCurve.len * 1; i++) {
            /*                var val = c1._curve[i];// == 0 ? 1 : 0;
             val = _.transform(val);
             console.log(i + 1, ':', val)*/
            var val = mixCurve.getNext();
            //val = _.transform(val);

            //    console.log(i + 1, val)
            if (val.taktVal !== 0) {

                taktStringArr.push(val.taktVal)
                taktString += val.taktVal + ' ';// + val.isQuarter+' ';

            }

            curveSum += val.curveSum;

            // val.curveSum = val.curveSum.toFixed(2);
            curveSring += '/' + val.curveSum;

        }

        console.log('taktStringArr' + ':  ', taktStringArr, ' /' + taktStringArr.length)
        console.log('curveSring' + ':  ' + 'curveSring' /*+ curveSring*/, ' curveSum: ', curveSum)
    }
};

module.exports = (function () {
    return {
        showInPureConsole: tmCurve.showInPureConsole,
        init: function (metrom) {

            _metrom = metrom ? metrom : _metrom;
        },
        setTakt: function (taktCnt, zaehler, nenner, curveType = 'sin', mixFunctionName = 'mixFinalClassic') {

            taktCnt = taktCnt ? taktCnt : 1;

            return tmCurve[mixFunctionName](taktCnt, zaehler, nenner, curveType);
        },

        /*main function to create naktmusters as curve*/
        getTmCurveXXX: function (opt) {

            var nenner = opt.nenner;
            var zaehler = opt.zaehler;
            var taktCnt = opt.taktCnt;
            const mixFunctionName = opt.mixFunctionName || 'mixFinal'

            taktCnt = taktCnt ? taktCnt : 1;
            return tmCurve.mixFinal(taktCnt, zaehler, nenner, curveType, mixFunctionName);
        },
        showInConsole: tmCurve.showInConsole,
    }
})();
