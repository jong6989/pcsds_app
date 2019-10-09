'use strict';
var myAppModule = {};
myAppModule = angular.module('brain_app', ['ngMaterial','ngAnimate', 'ngMessages','ngStorage','ngRoute','ngFileUpload','ngTable']);

myAppModule
.config(function($routeProvider, $locationProvider) {
  $routeProvider.when('/:name*', {
            templateUrl: function(urlattr){
                return 'app/' + urlattr.name + '/view.html';
            }
        })
  .otherwise({ redirectTo: '/' });

})

myAppModule.controller('AppCtrl', function ($scope,$window,$filter, $mdMedia, $http,$timeout, $interval, $mdSidenav, $log, $mdToast,$localStorage , $sessionStorage, $mdDialog, $route, $routeParams, $location, NgTableParams) {
  $scope.$route = $route;
  $scope.$routeParams = $routeParams;
  $scope.$location = $location;
  $scope.$localStorage = $localStorage;
  $scope.page_title = "";
  $scope.current_view = "";
  $scope.content_page = "";
  $scope.active_menu = "";
  $scope.menus = [];

  $scope.$watch( 
      ()=> { 
          return $mdMedia('xs'); 
      }, 
      (xs)=> {
      $scope.is_xs = xs;
  });
  $scope.$watch( 
      ()=> { 
          return $mdMedia('sm'); 
      }, 
      (sm)=> {
      $scope.is_sm = sm;
  });

  $scope.toggleLeft = buildDelayedToggler('left');
  $scope.toggleRight = buildToggler('right');

  $scope.to_date = function(d){
    return $filter('date')(d, "yyyy-MM-dd");
  };

  $scope.ngTable = function(d,c){
    if(c == undefined) c=100;
    return new NgTableParams({count:c}, { dataset: d});
  };

  $scope.to_int = (n)=>{
    return parseInt(n);
  };

  $scope.isOpenRight = function(){
    return $mdSidenav('right').isOpen();
  };

  $scope.date_gap = function(a,b,f){
    let df = (f == undefined)? "YYYY-MM-DD h:mm:ss" :f;
    moment().format(df);
    let x = moment(b);
    return x.from(a);
  };

  $scope.within_dates = function(date,from,to){
    var d = $scope.to_date(date);var a = $scope.to_date(from);var b = $scope.to_date(to);
    var aa = a.split("-");
    var ya = parseInt(aa[0]);
    var ma = parseInt(aa[1]);
    var da = parseInt(aa[2]);
    var bb = b.split("-");
    var yb = parseInt(bb[0]);
    var mb = parseInt(bb[1]);
    var db = parseInt(bb[2]);
    var xx = d.split("-");
    var yx = parseInt(xx[0]);
    var mx = parseInt(xx[1]);
    var dx = parseInt(xx[2]);
    var dir = (ya < yb)?1:( (ya > yb)? -1: ( ma < mb )?1: ( (ma > mb)?-1: ( (da < db)?1: ( (da > db)? -1:1 ) ) ) );
    if( ya > yx && yb > yx ) return false;
    if( ya < yx && yb < yx ) return false;

    if( ya === yx || yb === yx){
      if(dir === 1 && ya === yx){
        if( mx < ma ) return false;
      }
      if(dir === 1 && yb === yx){
        if( mx > mb ) return false;
      }
      if(dir === -1 && yb === yx){
        if( mx < mb ) return false;
      }
      if(dir === -1 && ya === yx){
        if( mx > ma ) return false;
      }
      if( ma === mx || mb === mx){
        if(dir === 1 && ma === mx){
          if( dx < da ) return false;
        }
        if(dir === -1 && mb === mx){
          if( dx < db ) return false;
        }
        if(dir === -1 && ma === mx){
          if( dx > da ) return false;
        }
        if(dir === 1 && mb === mx){
          if( dx > db ) return false;
        }
        return true;
      }else {
        return true;
      }
    }else {
      return true;
    }
  };

  $scope.get_window_height = function(){
    return $(window).height();
  };

  $scope.date_from_now = function(a){
    var a = moment(a);
    return a.fromNow();
  };

  $scope.date_now = function(){
    return moment().format("YYYY-MM-DD");
  };

  $scope.toast = function(t){
    $mdToast.show(
      $mdToast.simple()
        .textContent(t)
        .hideDelay(4000)
    );
  };

  $scope.logout = function(){
    firebase.auth().signOut().catch(function(error) {
          console.log(error)
    });
  };

  $scope.set_page_title = function(t){
    $scope.page_title = t;
    document.getElementById("site_title").innerHTML = "BRAIN-" + t;
  };

  $scope.isActive = function (path) {
    return ($location.path().substr(0, path.length) === path) ? true : false;
  }

  $scope.showPrerenderedDialog = function(ev,ID) {
    $mdDialog.show({
      contentElement: '#' + ID,
      parent: angular.element(document.body),
      targetEvent: ev,
      fullscreen : true,
      clickOutsideToClose: true
    });
  };
  $scope.close_dialog = function(){
    $mdDialog.cancel();
  };

  function debounce(func, wait, context) {
    var timer;

    return function debounced() {
      var context = $scope,
          args = Array.prototype.slice.call(arguments);
      $timeout.cancel(timer);
      timer = $timeout(function() {
        timer = undefined;
        func.apply(context, args);
      }, wait || 10);
    };
  }

  function buildDelayedToggler(navID) {
    return debounce(function() {
      $mdSidenav(navID)
        .toggle()
        .then(function () {
          $log.debug("toggle " + navID + " is done");
        });
    }, 200);
  }

  function buildToggler(navID) {
    return function() {
      $mdSidenav(navID)
        .toggle()
        .then(function () {
          $log.debug("toggle " + navID + " is done");
        });
    };
  }

  $scope.close_left_side = function () {
    $mdSidenav('left').close()
      .then(function () {
        $log.debug("close LEFT is done");
      });
  };

  $scope.close_right_side = function () {
    $mdSidenav('right').close()
      .then(function () {
        $log.debug("close Right is done");
      });
  };

  $scope.iframeHeight = $scope.get_window_height();
  angular.element($window).bind('resize',function(){
    $scope.iframeHeight = $window.innerHeight;
  });

  $scope.alert = (title,text,event)=>{
    $mdDialog.show(
      $mdDialog.alert()
        .title(title)
        .textContent(text)
        .ariaLabel(title)
        .ok('close')
        .targetEvent(event)
    );
  }

  function gotoBottom(id){
    setTimeout(()=>{
        var element = document.getElementById(id);
        element.scrollTop = element.scrollHeight - 200;
    },1500);
  }

  $scope.current_view = localData.get('staff_current_view');
  let storedAccount = localData.get('STAFF_ACCOUNT');

  function load_dashboard_page(){
    if(storedAccount){
      //staff account
      $scope.user = JSON.parse(storedAccount);
      if($location.path() == '/'){
        $location.path($scope.user.menu[0].path);
      }
    }
  }
  load_dashboard_page();
  $timeout( load_dashboard_page ,500);

  $scope.set_path = (path)=>{
    $location.path(path);
    $scope.close_left_side();
  };

  $scope.is_path = (path)=>{
    return ($location.path() == path);
  };

})

;