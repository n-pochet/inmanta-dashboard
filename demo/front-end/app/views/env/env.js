'use strict';



var resv = angular.module('ImperaApp.envView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('envs', {
            url: "/environment/:env",
            views: {
                "body": {
                    templateUrl: "views/env/envBody.html",
                    controller: "envController"
                },
                "side": {
                    templateUrl: "views/portal/portalSide.html"

                }
            }

        })
});

resv.controller('envController', ['$scope','$rootScope', 'imperaService', "$stateParams", "BackhaulTablePaged",function($scope,$rootScope, imperaService, $stateParams, BackhaulTablePaged) {

    $scope.state = $stateParams
  

    $scope.tableParams = BackhaulTablePaged($scope,{
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'id_fields.entity_type': 'asc' // initial sorting
        }
    }, function(start,extent) {
           return imperaService.getVersionsPaged($stateParams.env, start, extent)
    }, "versions");
    
    $scope.resources = null
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });
    
    $scope.startDryRun = function(res) {
        var resVersion = res.version 
        imperaService.changeReleaseStatus($stateParams.env,resVersion,true,true).then(function(d){$rootScope.$broadcast('refresh')});
        res.progress.DRYRUN={
            'TOTAL':1,
            'DONE': 0,
            'WAITING': 1,
            'ERROR': 0
        }
        
    }
    $scope.deploy = function(res) {
        var resVersion = res.version 
        imperaService.changeReleaseStatus($stateParams.env,resVersion,false,true).then(function(d){$rootScope.$broadcast('refresh')});
        res.progress.DEPLOY={
            'TOTAL':1,
            'DONE': 0,
            'WAITING': 1,
            'ERROR': 0
        }
    }


    
}]);
