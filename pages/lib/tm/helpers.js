/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


module.exports = {
    getRandom: function (val) {
        return Math.round(Math.random() * val) + 1
    },
    saveAsGerade: function (name, curves) {

        var c = curves ? curves : this;

        var fs = require('fs');
        name = name ? name : 'x'
        var toSave = [], toSave2 = [], series = []


        for (var i = 0; i <= c.len; i++) {
            var val = c.getNext(1);

            //  console.log('!!!!',1,c.getNext(1))

            toSave.push(val)


            series.push(
                toSave
            )

        }


        var script = "function init() {" +
            "new Chartist.Line('.ct-chart'," +
            " { series: " + JSON.stringify(series) + "}, {" +
            "  height: 355," +
            " width: '100%'," +
            "  showArea: true," +
            "    axisX: {" +
            "  showLabel: false," +
            "    showGrid: true" +
            "       }," +
            "     axisY: {" +
            "     showLabel: true," +
            "   showGrid: true" +
            "    }," +
            //   "  low: 0" +
            "    });}";

        var html = '<!DOCTYPE html><html><head>' +
            ' <title>' + name + '</title>' +
            '<meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.css">' +
            '<script src="https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.js"></script>' +
            '</head><body onload="init()"><div class="ct-chart"></div><script>' +
            script + '' + '</script></body></html>'

        fs.writeFile('./grapphviewer/' + name + '-graph.html', html, function (err) {
            if (err)
                throw err;
            console.log('Saved!');
        });

    },
    showCurve: function (curve) {
        const toSave = [],
            toSave2 = [],
            series = [];

        for (var i = 0; i <= c.len; i++) {
            const val = c.getNext();

//console.log(c.scaleMode()

            let curveSum = val.curveSum;
            curveSum *= 100;
            curveSum = Math.round(curveSum) / 100;
            toSave.push(curveSum)

            toSave2.push(val.taktVal);

            series.push(
                toSave,
                toSave2
            )

        }


        var script = "function init() {" +
            "new Chartist.Line('.ct-chart'," +
            " { series: " + JSON.stringify(series) + "}, {" +
            "  height: 355," +
            " width: '100%'," +
            "  showArea: true," +
            "    axisX: {" +
            "  showLabel: false," +
            "    showGrid: true" +
            "       }," +
            "     axisY: {" +
            "     showLabel: true," +
            "   showGrid: true" +
            "    }," +
            //   "  low: 0" +
            "    });}";

        var html = '<!DOCTYPE html><html><head>' +
            ' <title>' + name + '</title>' +
            '<meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.css">' +
            '<script src="https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.js"></script>' +
            '</head><body onload="init()"><div class="ct-chart"></div><script>' +
            script + '' + '</script></body></html>'



    },
    saveAsHtml: function (name, curves) {

        var c = curves ? curves : this;

        var fs = require('fs');
        name = name ? name : 'x'
        var toSave = [], toSave2 = [], series = []

        for (var i = 0; i <= c.len; i++) {
            var val = c.getNext();

//console.log(c.scaleMode()

            var curveSum = val.curveSum;
            curveSum *= 100;
            curveSum = Math.round(curveSum) / 100;
            toSave.push(curveSum)

            toSave2.push(val.taktVal)

            series.push(
                toSave,
                toSave2
            )

        }


        var script = "function init() {" +
            "new Chartist.Line('.ct-chart'," +
            " { series: " + JSON.stringify(series) + "}, {" +
            "  height: 355," +
            " width: '100%'," +
            "  showArea: true," +
            "    axisX: {" +
            "  showLabel: false," +
            "    showGrid: true" +
            "       }," +
            "     axisY: {" +
            "     showLabel: true," +
            "   showGrid: true" +
            "    }," +
            //   "  low: 0" +
            "    });}";

        var html = '<!DOCTYPE html><html><head>' +
            ' <title>' + name + '</title>' +
            '<meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<link rel="stylesheet" href="https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.css">' +
            '<script src="https://cdn.jsdelivr.net/chartist.js/latest/chartist.min.js"></script>' +
            '</head><body onload="init()"><div class="ct-chart"></div><script>' +
            script + '' + '</script></body></html>'

        fs.writeFile('./curve-plots/' + name + '-graph.html', html, function (err) {
            if (err)
                throw err;
            console.log('Saved!');
        });

    }
}
