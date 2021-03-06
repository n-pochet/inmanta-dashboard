'use strict';

var resv = angular.module('InmantaApp.logsView', ['ui.router', 'inmantaApi', 'ngTable', 'inmanta.services.backhaul', 'dialogs.main']);

resv.config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state('logs', {
        url: "/environment/:env/resource/:id?version",
        views: {
            "body": {
                templateUrl: "views/log/logBody.html",
                controller: "logController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"

            }
        }
    });
}]);

resv.controller('logController', ['$scope', 'inmantaService', "$stateParams", "BackhaulTable", "dialogs",
                function ($scope, inmantaService, $stateParams, BackhaulTable, dialogs) {
    $stateParams.id = window.decodeURIComponent($stateParams.id);
    $scope.state = $stateParams;
    $scope.version = $stateParams.id.substring($stateParams.id.lastIndexOf("=") + 1);
    $stateParams.version = $scope.version;

    $scope.tableParams = new BackhaulTable($scope, {
        page: 1, // show first page
        count: 25, // count per page
        sorting: {
            'timestamp': 'desc' // initial sorting
        }
    }, function (prms) {
        var state = {};
        var x;
        for (x in prms.data) {
            var line = prms.data[x];
            state[line.id] = line.open;
        }
        return inmantaService.getLogForResource($stateParams.env, $stateParams.id).then(function (info) {
            var data = info.logs;
            $scope.resource = info.resource;
            var i;
            for (i in data) {
                if (state[data[i].id]) {
                    data[i].open = true;
                }
            }
            return data;
        });
    });

    inmantaService.getEnvironment($stateParams.env).then(function (d) {
        $scope.env = d;
    });

    $scope.details = function (item) {
        dialogs.create('views/log/logDetail.html', 'msgDetailCtrl', {
            message: item,
            env: $stateParams.env
        }, {});
    };
}]);

resv.controller('msgDetailCtrl', ['$scope', '$modalInstance', 'data', "dialogs", function ($scope, $modalInstance, data, dialogs) {
    //-- Variables -----//
    $scope.header = " Log message details";
    $scope.env = data.env;
    $scope.kwargs = Object.keys(data.message.kwargs);
    $scope.message = data.message;

    $scope.icon = 'glyphicon glyphicon-info-sign';
}]); // end WaitDialogCtrl