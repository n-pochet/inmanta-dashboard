'use strict';



var resv = angular.module('InmantaApp.reportView', ['ui.router', 'inmantaApi', 'ngTable','dialogs.main','InmantaApp.diffDetail'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider.state('report', {
        url: "/environment/:env/version/:version/report?id",
        views: {
            "body": {
                templateUrl: "views/report/reportBody.html",
                controller: "reportController"
            },
            "side": {
                templateUrl: "views/env/envSide.html",
                controller: "sideController"
            }
        }
    });
}]);

resv.controller('reportController', ['$scope', 'inmantaService', "$stateParams","dialogs","BackhaulTable","$q","$rootScope",
    function($scope, inmantaService, $stateParams,dialogs,BackhaulTable, $q, $rootScope) {
        $scope.state = $stateParams;
        $scope.data = {"dryrun": {}};

        $scope.tableParams = new BackhaulTable($scope, {
            page: 1, // show first page
            count: 50 // count per page,
        }, function(params){
            if (!$stateParams.id) {
                var out = $q.defer();
                out.resolve([]);
                return out.promise;
            } else {
                return inmantaService.getDryrun($stateParams.env,$scope.state.id).then(function (d) {
                    $scope.mydryrun = d;
                    var out = [];
                    for (var k in d.resources) {
                        var res = angular.copy(d.resources[k]);
                        res["id"] = k;
                        res["changessize"] = Object.keys(res.changes).length;
                        out.push(res);
                    }
                    return out;
                });
            }
        });

        $scope.$watch("data.dryrun.id", function () {
            if ($scope.data.dryrun.id) {
                $scope.state.id = $scope.data.dryrun.id
                $scope.tableParams.refresh()
            }
        }, true);

        function loadList () {
            inmantaService.getDryruns($stateParams.env,$stateParams.version).then(function(d) {
                d.reverse()
                $scope.dryruns = d
                if(!$scope.state.id && d.length>0){
                    $scope.state.id = d[0].id
                    $scope.data.dryrun.id = d[0].id
                    $scope.tableParams.refresh()
                }
            });
        }
        loadList();
        $scope.$on('refresh', loadList);

        inmantaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });

        $scope.open = function(d,id) {
            dialogs.create('views/diffDetail/diffDetail.html', 'diffDetailCtrl', {
                diff:d,
                id:id
            }, {});
        }

        $scope.dryrun = function() {
            inmantaService.dryrun($stateParams.env,$stateParams.version).then(function(d){$rootScope.$broadcast('refresh')});
        }

        $scope.details = function(item) {
            inmantaService.getResource($stateParams.env, item.id).then(function (d) {
                dialogs.create('views/resourceDetail/resourceDetail.html', 'resourceDetailCtrl', {
                    resource: d,
                    env:$stateParams.env
                }, {});
            });
        }
    }
]);
