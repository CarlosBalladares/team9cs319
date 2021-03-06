(function() {

  'use strict';

  /**
   * @desc - This will be responsible for both receiving alert streams from
   *         the DCH server and fetching all alerts during initialization.
   *         It will also be responsible for issuing deletion commands.
   *
   * @ngInject
   *  - $http
   */
  angular
    .module('dcgui.shared')
    .service('CanaryAlertService', CanaryAlertService);

  CanaryAlertService.$inject = ['$http'];

  function CanaryAlertService($http) {
    var canaryAlertService = {
      getWatchAlerts: getWatchAlerts,
      requestWatchAlerts: requestWatchAlerts,
      regiterCallback: regiterCallback,
      deleteWatchAlert: deleteWatchAlert,
    };

    var ALERT_STREAM_PATH = 'api/alert-sse';
    var ALERT_EVENT = 'alert-event';
    var GET_ALERTS_PATH = '/api/get-alerts';
    var DELETE_ALERT_PATH = '/api/delete-alert';

    var callbacks = [];

    var alertStream;

    // Initialize SSE stream
    initializeStream();

    var testDate = new Date();
    var watchAlerts = { alerts : []};

    // Return the service as an object. Angular treats it as a Singleton.
    return canaryAlertService;

    /**
     * @desc - Getter for the watch alerts object
     *
     * @return {object} - The watch alerts object
     */
    function getWatchAlerts() {
      return watchAlerts;
    }

    /**
     * @desc - Responsible for fetching watch alerts from server. Inserts
     *         retrieved data into the watchAlerts object. Executes a callback
     *         function upon success.
     *
     * @param callback {function} - Function to execute when data is retrieved.
     */
    function requestWatchAlerts(callback) {
      var responsePromise = $http.get(GET_ALERTS_PATH);

      responsePromise.success(function(response) {
        console.log(response);
        watchAlerts.alerts = response;
        angular.forEach(watchAlerts.alerts, function(alert) {
          var convertedDate = new Date(alert.timestamp);
          alert.timestamp = convertedDate.toString();
        })
        callback(response);
      });

      responsePromise.error(function(error) {
        console.log('Request for alerts failed.');
        console.log(error);
      });
    }


    function deleteWatchAlert(alert) {
      $http.get(DELETE_ALERT_PATH + '/' + alert._id)
    }

    /**
     * @desc - Initialize the alert stream
     */
    function initializeStream() {
      alertStream = new EventSource(ALERT_STREAM_PATH);

      alertStream.addEventListener('open', function() {
        console.log('Connection to alert stream established');
      });

      alertStream.addEventListener(ALERT_EVENT, function(event) {
        try{
          var data = JSON.parse(event.data);
          // If no data is retrieved, there's nothing to do.
          if (!data.length) return;
          watchAlerts.alerts.push.apply(watchAlerts.alerts, data);
          console.log(data);
          console.log(watchAlerts);
          executeCallbacks(data);
        } catch(e) {
          console.log(e);
        }
      });
    }

    /**
     * @desc - Register callback function
     *
     * @param callback {function} - The call back to be executed when
     *         connection status data arrives
     */
    function regiterCallback(callback) {
      callbacks.push(callback);
    }

    /**
     * @desc - Executes callbacks with individual pieces of data retrieved
     *         from the alerts SSE stream.
     *
     * @param data {[object]} - The data retreived from the alerts SSE
     */
    function executeCallbacks(data) {
      var totalConnectionObjects = data.length;
      for (var callbackIndex in callbacks) {
        var currentCallback = callbacks[callbackIndex]
        for (var dataIndex in data) {
          var currentData = data[dataIndex];
          console.log('data!');
          console.log(currentData);
          var convertedDate = new Date(currentData.timestamp)
          currentData.timestamp = convertedDate.toString();
          currentCallback(currentData);

        }
      }
    }
  }
})();
