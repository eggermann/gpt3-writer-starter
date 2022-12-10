/*taktmuster
 1.metronom m.M*
 https://de.wikipedia.org/wiki/Tempo_(Musik)#Metronomangaben
 
 1m /schläge
 */



var Metrom = function (tempo, pulsePerQuarter) {
//    _.defaults.call(this, tempo, pulsePerQuarter);
    this.setTempo(tempo, pulsePerQuarter);
    //mili 1/4/pulsePerQuarter eg:1/4/1=250
}

//minimalst midi-step eg:250 :1, 
Metrom.prototype.getPulseStep = function ()
{
    return this.pulsePerQuarterInMilli / this.pulsePerQuarter;
}


Metrom.prototype.setTempo = function (tempo, pulsePerQuarter)
{
    this.tempo = tempo ? tempo : this.tempo;
    this.pulsePerQuarter = pulsePerQuarter ? pulsePerQuarter : this.pulsePerQuarter;
    //  var metrum = beatsPerMinute * pulsePerQuarter;//60*96=5760//
    var quarterInMilli = 60000 / tempo
    console.log(quarterInMilli, 'milis -->is  1/4 of a takt with tempo ' + tempo)

    var pulsePerQuarterInMilli = quarterInMilli / this.pulsePerQuarter; //* pulsePerQuarter;
    console.log(pulsePerQuarterInMilli, 'mili is the pulsefreq by pulsePerQuarter:' + this.pulsePerQuarter)


    this.quarterInMilli = quarterInMilli;
    this.pulsePerQuarterInMilli = pulsePerQuarterInMilli;


    this.getInBeats = {
        minute: this.pulsePerQuarter * 4 * 60
    }

};

module.exports = Metrom;





