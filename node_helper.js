/* global module */

/* Magic Mirror
 * Node Helper: MMM-COVID19-Ampel
 *
 * By Daniel Osterkamp
 * MIT Licensed.
 */

var NodeHelper = require('node_helper')
const fetch = require('node-fetch');
var needle = require('needle');


var incidentURLPrefix = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=&objectIds='
var incidentURLSuffix = '&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=OBJECTID%2CGEN%2CBEZ%2Ccases7_per_100k%2Ccases7_bl_per_100k%2CBL%2Ccases_per_population%2Ccases%2Cdeath_rate%2Clast_update&returnGeometry=false&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=4326&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token='
var spacer = '%2C'
var requestURL = ''
var vaccinationURL = 'https://impfdashboard.de/static/data/germany_vaccinations_timeseries_v2.tsv'

module.exports = NodeHelper.create({
  start: function () {
    console.log('Starting node helper for: ' + this.name)
  },
  getIncidents: function (key) {
    var self = this
    if (key.length === 1) {
      requestURL = incidentURLPrefix + key[0] + incidentURLSuffix;
    }
    if (key.length > 1) {
      requestURL = incidentURLPrefix + key[0]
      for (let index = 1; index < key.length; index++) {
        const element = key[index];
        requestURL += spacer + element;
      }
      requestURL += incidentURLSuffix;
    }

    fetch(requestURL)
    .then(res => res.text())
    .then(body => { 
      var result = JSON.parse(body)
      self.sendSocketNotification('INCIDENTS', result.features)
    });

//Getting Vaccinations
var options = {
  method: 'GET',
  url: vaccinationURL,
  headers: {
    'Cache-Control' : "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    'Pragma' : "no-cache",
    'Expires' : 0,
    'Surrogate-Control' : "no-store"
  }
}

//Seems like the larger file does not get read by request - using needle instead
needle.get(vaccinationURL, { compressed: true }, function(error, response) {
  if (!error && response.statusCode == 200) {
    var lines = response.body.split("\\r?\\n", -1);
    self.sendSocketNotification('VACCINATIONS', lines);
  }
});

  },
  //Subclass socketNotificationReceived received.
  socketNotificationReceived: function (notification, payload) {
    if (notification === 'GET_INCIDENTS') {
      this.getIncidents(payload)
    }
  }
});
