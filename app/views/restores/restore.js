'use strict';

var resv = angular.module('InmantaApp.restoreView', ['ui.router', 'inmantaApi', 'ngTable','inmanta.services.backhaul','InmantaApp.inputDialog'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('restores', {
            url: "/environment/:env/restore",
            views: {
                "body": {
                    templateUrl: "views/restores/restoreBody.html",
                    controller: "restoreController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);

resv.controller('restoreDialogCtrl',['$scope','$modalInstance','data','$stateParams','inmantaService',
        function($scope,$modalInstance,data,$stateParams,inmantaService) {
	//-- Variables -----//
   inmantaService.getEnvironmentsWithProject().then(function(f){
        $scope.envs = f
   });
   
   
   inmantaService.getSnapshots($stateParams.env).then(function(f){
        $scope.snapshots = f
   });

	//-- Methods -----//
	
	$scope.done = function() {
	    inmantaService.restoreSnapshot($scope.env.id,$scope.snapshot.id).then(function(d){$modalInstance.close(d);});
	    
	}
	
	$scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);


resv.controller('restoreController', ['$scope', '$rootScope', 'inmantaService', "$stateParams", "BackhaulTable","dialogs",
    function($scope, $rootScope, inmantaService, $stateParams, BackhaulTable,dialogs ) {
       $scope.state = $stateParams
       $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10,
            sorting: {
                'started': 'desc' // initial sorting
            }
        }, function(params){
                    return  inmantaService.getEnrichedRestores($stateParams.env)
        });
        
       $scope.deleteRestore = function(id){
            var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the restore " + id);
		    dlg.result.then(function(btn){
                inmantaService.deleteRestore($stateParams.env,id).then( function(){$rootScope.$broadcast('refresh');});
	        })  
       }

       $scope.startRestore = function(id){
            dialogs.create('views/restores/restoreForm.html', 'restoreDialogCtrl', {
              
            }, {}).result.then(function(){$rootScope.$broadcast('refresh');})
       }
      
    }

    
]);
