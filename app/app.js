'use strict';
var JsonDB = require('node-json-db');
const queryString = require('query-string');
const { ipcRenderer } = require('electron');
var fs = require('fs');
var request = require('request');

var download = (uri, filename, callback)=>{
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

var NOTIFICATION_DB = new JsonDB("./DB/NOTIFICATIONS", true, false);
const notif_string = "/notifications";
try {
  NOTIFICATION_DB.getData(notif_string + "[0]");
} catch(error) {
  NOTIFICATION_DB.push(notif_string,[]);
};

const api_address = "https://brain.pcsd.gov.ph/api";
// const api_address = "http://localhost/pcsds_api";
//initialize moment
moment().format("YYYY-MM-DD h:mm:ss");

var myAppModule = angular.module('pcsd_app', ['ngMaterial','ngAnimate', 'ngMessages','ngFileUpload','ngStorage','ngTable'])

.factory("$utils",function($mdToast){
   var f = {};
   f.api = (q)=>{
      request.post(api_address + "/?", {form:q.data,json: true},(err,httpResponse,data)=>{
        if(q.errorCallBack!==undefined){
          if(err){
            return q.errorCallBack(err);
          }
        }
        if(httpResponse.statusCode == 200){
          var j = data;
          if(typeof j !== typeof {}){
            j = JSON.parse(data);
          }
          if(q.callBack!==undefined)q.callBack({data:j});
        }else {
          $mdToast.show(
            $mdToast.simple()
              .textContent("You are OFFLINE!")
              .hideDelay(4000)
          );
        }
      });
    };
    f.upload = (callback)=>{
      var r = request.post(api_address + "/?", function optionalCallback(err, httpResponse, data) {
        if(callback !== undefined) callback(JSON.parse(data),httpResponse.statusCode);   
      });
      return r.form();
    };
   return f;
})
.factory('Excel',function($window){
        var uri='data:application/vnd.ms-excel;base64,',
            template='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style type="text/css"> .print-hide{display: none;} </style></head><body><table>{table}</table></body></html>',
            base64=function(s){return $window.btoa(unescape(encodeURIComponent(s)));},
            format=function(s,c){return s.replace(/{(\w+)}/g,function(m,p){return c[p];})};
        return {
            tableToExcel:function(tableId,worksheetName){
                var table=$(tableId),
                    ctx={worksheet:worksheetName,table:table.html()},
                    href=uri+base64(format(template,ctx));
                return href;
            },
            getExcel:function(input_id){
                  /*Checks whether the file is a valid excel file*/
                  var generatedReport = [];
                   var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.xlsx|.xls)$/;
                   var xlsxflag = false; /*Flag for checking whether excel is .xls format or .xlsx format*/  
                   if ($("#" + input_id).val().toLowerCase().indexOf(".xlsx") > 0) {  
                     xlsxflag = true;  
                    } 
                    console.log(xlsxflag);
                   var reader = new FileReader();  
                   reader.onload = function (e) {  
                     var data = e.target.result;  
                     if (xlsxflag) {  
                       var workbook = XLSX.read(data, { type: 'binary' });  
                     }  
                     else {  
                        var workbook = XLS.read(data, { type: 'binary' });  
                     }    
                     
                     var sheet_name_list = workbook.SheetNames;  
                     var cnt = 0; 
                     sheet_name_list.forEach(function (y) { /*Iterate through all sheets*/  
                       
                       if (xlsxflag) {  
                         var exceljson = XLSX.utils.sheet_to_json(workbook.Sheets[y]);  
                       }  
                       else {  
                         var exceljson = XLS.utils.sheet_to_row_object_array(workbook.Sheets[y]);  
                       }   
                       if (exceljson.length > 0) {  
                         for (var i = 0; i < exceljson.length; i++) {  
                              generatedReport.push(exceljson[i]);  
                              // $scope.$apply();  
                         }  
                       }  
                     });  
                   }  
                   if (xlsxflag) {
                     reader.readAsArrayBuffer($("#" + input_id)[0].files[0]);  
                   }  
                   else {  
                     reader.readAsBinaryString($("#" + input_id)[0].files[0]);  
                   }
                return generatedReport;
            }
        };
    })


.controller('AppCtrl', function ($scope,$window,$filter,$http, $timeout, $mdSidenav, $log, $utils, $mdToast,$localStorage, $mdDialog,$location, Excel, NgTableParams) {
    $scope.$localStorage = $localStorage;
    $scope.page_title = "";
    $scope.current_view = "";
    $scope.content_page = "";
    $scope.active_page = "";
    $scope.active_menu = "";
    $scope.menus = [];
    $scope.api_address = api_address;

    $scope.toggleLeft = buildDelayedToggler('left');
    $scope.toggleRight = buildToggler('right');

    $scope.download = (uri,fname)=>{
      download(uri,fname,null)
    }

    $scope.ngTable = function(d,c){
      if(c == undefined) c=100;
      return new NgTableParams({count:c}, { dataset: d});
    };

    $scope.change_page = function(p){
      $scope.content_page = "app/" + p + "/view.html";
      $scope.active_page = p;
      $localStorage.content_page = p;
      $scope.close_left_side();
    };

    $scope.to_date = function(d){
      return $filter('date')(d, "yyyy-MM-dd");
    };

    $scope.isOpenRight = function(){
      return $mdSidenav('right').isOpen();
    };

    $scope.date_gap = function(a,b){
      var x = moment(b);
      return x.from(a);
    };

    $scope.file_exist = (f)=>{
      return fs.existsSync(f);
    };

    $scope.get_data = function(path,xDb){
      try {
        return xDb.getData(path);
      } catch(error) {
        return [];
      };
    };

    $scope.open_window_view = function(v,d){
      $localStorage.params = d;
      var x = {view: v,last_view : $scope.current_view};
      window.open('index.html?'+ $.param(x), 'modal');
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

    $scope.import_report = function(id){
        Excel.getExcel(id,$scope);
    };

    $scope.get_window_height = function(){
      return $(window).height();
    };

    $scope.exportToExcel=function(Id,title){ 
        var exportHref=Excel.tableToExcel("#"+Id,title);
        $timeout(function(){location.href=exportHref;},100); // trigger download
    };
    $scope.date_from_now = function(a){
      var a = moment(a);
      return a.fromNow();
    };

    $scope.date_now = function(){
      return moment().format("YYYY-MM-DD");
    };

    $scope.to_year = function(d){
      return $filter('date')(d, "yyyy");
    }

    $scope.to_month = function(d){
      return $filter('date')(d, "MM");
    }

    $scope.toast = function(t){
      $mdToast.show(
        $mdToast.simple()
          .textContent(t)
          .hideDelay(4000)
      );
    };

    $scope.login_attempt = function(d){
      var q = { 
        data : { 
          action : "user/login",
          id_number : d.id_number,
          key : d.key
        },
        callBack : function(data){
          if(data.data.status == 0){
            $scope.toast(data.data.error + "  : " + data.data.hint);
          }else {
            $scope.current_view = $localStorage.current_view = data.data.data.main_view;
            $localStorage.page_content = data.data.data.page_content;
            $scope.change_page(data.data.data.page_content);
            $scope.user = $localStorage.pcsd_app_user = data.data.data.user;
            $localStorage.pcsd_menus = $scope.menus = data.data.data.menus;
          }
        }
      };
      $utils.api(q);
    };

    $scope.logout = function(){
      $scope.current_view = "app/login/view.html";
      $scope.content_page = "";
      $localStorage.current_view = undefined;
      $localStorage.content_page = undefined;
      $localStorage.pcsd_app_user = undefined;
      $scope.user = undefined;
      //clear notifications
      NOTIFICATION_DB.push(notif_string,[]);
    };

    $scope.set_page_title = function(t){
      $scope.page_title = t;
    };

    $scope.isActive = function (path) {
      return ($scope.active_page == path) ? true : false;
    }

    $scope.set_selected_notif =(x)=>{
      $scope.selected_notif = x;
    }

    $scope.showPrerenderedDialog = function(ev,ID) {
      $mdDialog.show({
        contentElement: '#' + ID,
        parent: angular.element(document.body),
        targetEvent: ev,
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

    $scope.print = ()=>{
      $timeout( ()=>{
        $window.print();
        $timeout( ()=>{
          $window.close();
        }, 500 );
      }, 1300 );
    };

    $scope.run_initials = function(){
      if($localStorage.pcsd_app_user !== undefined && $localStorage.current_view !== undefined && $localStorage.content_page !== undefined){
        $scope.current_view = $localStorage.current_view;
        $scope.user = $localStorage.pcsd_app_user;
        $scope.menus = $localStorage.pcsd_menus;
        $scope.change_page($localStorage.page_content);
      }else{
        $scope.current_view = "app/login/view.html";
      }

      // $scope.current_view = "app/login/view.html";

    };

    $scope.iframeHeight = $scope.get_window_height();
    angular.element($window).bind('resize',function(){
      $scope.iframeHeight = $window.innerHeight;
      $scope.$digest();
    });

    $scope.getUserType = function(n){
      if(n==99)return "Admin";
      if(n==0)return "OJT";
      if(n==1)return "Front Desk Staff";
      if(n==2)return "Central Registry Staff";
      if(n==3)return "ED Secretary";
      if(n==4)return "Executive Director";
      if(n==5)return "Permitting Staff";
      if(n==6)return "Field Staff";
      if(n==7)return "Permitting Chief";
      if(n==8)return "Operations Director";
    };
  
    if(global.location.search == ""){
      $scope.run_initials();
    }else {
      $scope.render_params = queryString.parse(global.location.search) ;
      $scope.current_view = $scope.render_params.view;
      $scope.render_params.data = $localStorage.params;
    }

    $scope.validate_user = (ars)=>{
      var r = false;
      ars.forEach(element => {
          if($scope.user.user_level == element) r = true;
      });
      return r;
    };

    $scope.get_notifs = ()=>{
        return NOTIFICATION_DB.getData(notif_string);
    };

    $scope.set_new_notif = ()=>{
      $scope.new_notif = ($scope.user.data.received_notifs == undefined) ? ( ($scope.notifs == undefined)? 0 : $scope.notifs.length ) : $scope.notifs.length - $scope.user.data.received_notifs;
    };

    $scope.set_notif =()=>{
        $scope.notifs = $scope.get_notifs();
        $scope.set_new_notif();
    };
    $scope.load_notifs = ()=>{
        if($scope.user != undefined){
          var d = NOTIFICATION_DB.getData(notif_string);
          var l = (d.length > 0)? d[d.length - 1].id : 0;
          var current_length = d.length;
          let q = { 
              data : { 
                  action : "database/notification/load",
                  offset : current_length,
                  last_id : l,
                  user_id : $scope.user.id
              },
              callBack : function(data){
                  if(data.data.status == 1){
                      NOTIFICATION_DB.push(notif_string,data.data.data,false);
                      $timeout($scope.set_notif,200);
                  }
                  $timeout($scope.load_notifs,3000);
              }
          };
          $utils.api(q);
        }
    };

    $scope.clear_notif = (n)=>{
      if($scope.new_notif > 0){
        $http.get(api_address + "?action=user/clear_notif&user_id=" + $scope.user.id + "&count=" + n ).then(function(data){
          $scope.user = $localStorage.pcsd_app_user = data.data.data;
          $scope.set_notif();
        });
      }
    };
    
    
})
;