'use strict';
var myAppModule = {};
myAppModule = angular.module('brain_app', [
  'ngMaterial', 'ngAnimate', 'ngMessages', 'ngStorage', 'ngRoute',
  'ngFileUpload', 'ngTable', 'camera', 'ngImgCrop', 'thatisuday.ng-image-gallery',
  'angular-uuid', 'infinite-scroll', 'ui.bootstrap.datetimepicker', 'colorpicker.module']);

myAppModule
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider.when(':name*', {
      templateUrl: function (urlattr) {
        return 'app/' + urlattr.name + '/view.html';
      }
    })
      .otherwise({ redirectTo: '' });

  })

const static_ops_id = "ops_id";
const static_latitude = "ops_id";
const static_longitude = "ops_id";

myAppModule.controller('AppCtrl', function ($scope, $window, $filter, $mdMedia,
  $http, $timeout, $interval, $mdSidenav, $log, $mdToast, $localStorage, $sessionStorage,
  $mdDialog, $route, $routeParams, $location, NgTableParams) {
  $scope.$route = $route;
  $scope.$routeParams = $routeParams;
  $scope.$location = $location;
  $scope.$localStorage = $localStorage;
  $scope.page_title = "";
  $scope.current_view = "";
  $scope.content_page = "";
  $scope.active_menu = "";
  $scope.menus = [];
  $scope.document_network_url = 'http://localhost/pcsd/qr/';
  //app globals
  $scope.global = {
    ops: { id: 'WJ43CJV6R3uF3QMaWrvj', name: 'Operations', short_name: 'Ops' }
  };

  $scope.url = new URLSearchParams(window.location.search);
  //url.get('key')
  //url.has('key')
  //url.set('key')
  $scope.set_url_param = (param, hash) => {
    let new_hash = (hash) ? "#!" + hash : location.hash;
    let new_url = location.origin + location.pathname + "?" + param + new_hash;
    location.assign(new_url);
  };

  $scope.exists = function (item, list) {
    return list.indexOf(item) > -1;
  };

  $scope.toggle_select = function (item, list) {
    var idx = list.indexOf(item);
    if (idx > -1) {
      list.splice(idx, 1);
    }
    else {
      list.push(item);
    }
  };

  $scope.$watch(
    () => {
      return $mdMedia('xs');
    },
    (xs) => {
      $scope.is_xs = xs;
    });
  $scope.$watch(
    () => {
      return $mdMedia('sm');
    },
    (sm) => {
      $scope.is_sm = sm;
    });

  $scope.toggleLeft = buildDelayedToggler('left');
  $scope.toggleRight = buildToggler('right');

  $scope.to_date = function (d) {
    return $filter('date')(d, "yyyy-MM-dd");
  };

  $scope.millisecondsToDate = (ms) => {
    return new Date(ms)
  };

  $scope.ngTable = function (d, c) {
    if (c == undefined) c = 100;
    return new NgTableParams({ count: c }, { dataset: d });
  };

  $scope.to_int = (n) => {
    return parseInt(n);
  };

  $scope.isOpenRight = function () {
    return $mdSidenav('right').isOpen();
  };

  $scope.date_gap = function (a, b, f) {
    let df = (f == undefined) ? "YYYY-MM-DD h:mm:ss" : f;
    moment().format(df);
    let x = moment(b);
    return x.from(a);
  };

  $scope.toMilliseconds = (date) => {
    return date.getTime();
  }

  $scope.within_dates = function (date, from, to) {
    var d = $scope.to_date(date); var a = $scope.to_date(from); var b = $scope.to_date(to);
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
    var dir = (ya < yb) ? 1 : ((ya > yb) ? -1 : (ma < mb) ? 1 : ((ma > mb) ? -1 : ((da < db) ? 1 : ((da > db) ? -1 : 1))));
    if (ya > yx && yb > yx) return false;
    if (ya < yx && yb < yx) return false;

    if (ya === yx || yb === yx) {
      if (dir === 1 && ya === yx) {
        if (mx < ma) return false;
      }
      if (dir === 1 && yb === yx) {
        if (mx > mb) return false;
      }
      if (dir === -1 && yb === yx) {
        if (mx < mb) return false;
      }
      if (dir === -1 && ya === yx) {
        if (mx > ma) return false;
      }
      if (ma === mx || mb === mx) {
        if (dir === 1 && ma === mx) {
          if (dx < da) return false;
        }
        if (dir === -1 && mb === mx) {
          if (dx < db) return false;
        }
        if (dir === -1 && ma === mx) {
          if (dx > da) return false;
        }
        if (dir === 1 && mb === mx) {
          if (dx > db) return false;
        }
        return true;
      } else {
        return true;
      }
    } else {
      return true;
    }
  };

  $scope.get_window_height = function () {
    return $(window).height();
  };

  $scope.date_from_now = function (a) {
    var a = moment(a);
    return a.fromNow();
  };

  $scope.date_now = function (format) {
    return moment().format((format) ? format : "YYYY-MM-DD");
  };

  $scope.toast = function (t) {
    $mdToast.show(
      $mdToast.simple()
        .textContent(t)
        .hideDelay(4000)
    );
  };

  $scope.toast_s = (text) => {
    Toast.fire({
      type: 'success',
      title: text
    });
  };

  $scope.toast_e = (text) => {
    Toast.fire({
      type: 'error',
      title: text
    });
  };

  $scope.logout = function () {
    // firebase.auth().signOut().catch(function(error) {
    //       console.log(error)
    // });

    localData.remove('BRAIN_STAFF_ID');
    localData.remove('STAFF_ACCOUNT');
    localData.remove('staff_current_view');
    location.href = "index.html";

  };

  $scope.set_page_title = function (t) {
    $scope.page_title = t;
    document.getElementById("site_title").innerHTML = "BRAIN-" + t;
  };

  $scope.isActive = function (path) {
    return ($location.path().substr(0, path.length) === path) ? true : false;
  }

  $scope.showPrerenderedDialog = function (event, ID) {
    $mdDialog.show({
      contentElement: '#' + ID,
      parent: angular.element(document.body),
      targetEvent: event,
      fullscreen: true,
      clickOutsideToClose: true,
      multiple: true
    });
  };

  $scope.close_dialog = function () {
    $mdDialog.cancel();
  };

  function debounce(func, wait, context) {
    var timer;

    return function debounced() {
      var context = $scope,
        args = Array.prototype.slice.call(arguments);
      $timeout.cancel(timer);
      timer = $timeout(function () {
        timer = undefined;
        func.apply(context, args);
      }, wait || 10);
    };
  }


  function buildDelayedToggler(navID) {
    return debounce(function () {
      $mdSidenav(navID)
        .toggle()
        .then(function () {
          $log.debug("toggle " + navID + " is done");
        });
    }, 200);
  }

  function buildToggler(navID) {
    return function () {
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
  angular.element($window).bind('resize', function () {
    $scope.iframeHeight = $window.innerHeight;
  });

  $scope.alert = (title, text, event) => {
    $mdDialog.show(
      $mdDialog.alert()
        .title(title)
        .textContent(text)
        .ariaLabel(title)
        .ok('close')
        .targetEvent(event)
    );
  }

  function gotoBottom(id) {
    setTimeout(() => {
      var element = document.getElementById(id);
      element.scrollTop = element.scrollHeight - 200;
    }, 1500);
  }

  //setting data for application
  $scope.set_application = (application) => {
    $scope.application = application;
  };

  $scope.printView = (timer) => {
    $timeout(() => {
      window.print();
      window.close();
    }, (timer) ? timer : 2000);
  };

  $scope.open_print_view = function (view, data) {
    $localStorage.params = data;
    $localStorage.print_view = view;
    window.open('#!/print', 'modal');
  };

  //switch from dashboard to print view
  if ($location.path() == 'print') {
    $scope.current_view = $localStorage.print_view;
    $timeout(() => {
      if ($scope.current_view == undefined) location.reload();
    }, 300);
  } else {
    $scope.current_view = localData.get('staff_current_view');
  }

  let storedAccount = localData.get('STAFF_ACCOUNT');

  function load_dashboard_page() {
    if (storedAccount) {
      //staff account
      $scope.user = JSON.parse(storedAccount);

      if (location.hash == '') {
        if ($scope.user.menu[0].path) {
          $location.path($scope.user.menu[0].path);
        } else {
          $location.path($scope.user.menu[0].menu[0].path);
        }
      }
    }
  }
  load_dashboard_page();
  // $timeout( load_dashboard_page ,500);

  $scope.set_path = (path) => {
    $location.path(path);

    $scope.close_left_side();
  };


  $scope.is_path = (path) => {
    return ($location.path() == path);
  };

  $scope.toString = (collection, key) => {
    if (collection == null) return;
    var values = key ? collection.map(item => item[key]) : collection;
    var slicedElements = values.slice(0, values.length - 1);
    var joined = slicedElements.join(', ') + ' and ' + values[values.length - 1];

    return joined;
  }

  $scope.get_full_date = function (date) {
    return $filter('date')(date, "MMMM dd, yyyy");
  }
  $scope.get_full_month_name = function (date) {
    return $filter('date')(date, "MMMM");
  }
  $scope.to_day = function (d) {
    return $filter('date')(d, "dd");
  }

  $scope.pcsd = {
    head: {
      full_name: "Nelson P. Devandera",
      position: "PCSDS Executive Director"
    }
  }

  // $scope.set_path('/profile_management/print');
  $scope.generate_qr_code = (id, text) => {
    var qr = new QRCode(document.getElementById(id), { text: text, width: 128, height: 128 });
    return qr;
  };

  var signaturePad = [];
  $scope.generate_signature_field = (id, idx) => {
    let wrapper = document.getElementById(id);
    let canvas = wrapper.querySelector('canvas');
    signaturePad[idx] = new SignaturePad(canvas);
    $scope.signed = (i) => {
      return signaturePad[i].toDataURL();
    }
    $scope.signisEmpty = (i) => {
      signaturePad[i].isEmpty();
    }
    $scope.signclear = (i) => {
      signaturePad[i].clear();
    }
    $scope.signoff = (i) => {
      signaturePad[i].off();
    }
    $scope.signon = (i) => {
      signaturePad[i].on();
    }
  }

  $scope.exportToExcel = (json, fileName, fixedHeaderCallBack) => {
    var ws = XLSX.utils.json_to_sheet(json);
    fixedHeader(ws);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    
    if(!fileName.endsWith('.xlsx'))
      fileName += '.xlsx';
    XLSX.writeFile(wb, fileName);
  }

}).service('account_service', function () {
  this.getAccounts = () => {
    return new Promise((resolve, reject) => {
      db.
        collection('accounts').
        orderBy('name').
        onSnapshot(snapshot => {
          var accounts = snapshot.docs.map(item => {
            let account = item.data();
            account.id = item.id;
            return account;
          });
          resolve(accounts);
        })
    });
  }
});