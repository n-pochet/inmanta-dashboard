'use strict';

// Declare app level module which depends on views, and components
angular.module('ImperaApp', [
  'ui.router',
  'ui.bootstrap',
  'ngTable',
  'ImperaApp.portalView',
  'ImperaApp.resourceView',
  'ImperaApp.envView',
  'ImperaApp.addEnv',
  'ImperaApp.graphView',
  'imperaApi.config'
]).config(function($urlRouterProvider) {
  $urlRouterProvider.otherwise("/portal");   
}).controller("configCtrl",["$scope","imperaConfig",function($scope,imperaConfig){
  $scope.config=imperaConfig
}])
