'use strict';
var JsonDB = require('node-json-db');
const queryString = require('query-string');
const { ipcRenderer } = require('electron');
var fs = require('fs');
// var request = require('request');

// var download = (uri, filename, callback)=>{
//   request.head(uri, function(err, res, body){
//     request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
//   });
// };

var NOTIFICATION_DB = new JsonDB("DB/NOTIFICATIONS", true, false);
const notif_string = "/notifications";
try {
  NOTIFICATION_DB.getData(notif_string + "[0]");
} catch(error) {
  NOTIFICATION_DB.push(notif_string,[]);
};

// const api_address = "https://brain.pcsd.gov.ph/api";
const api_address = "http://localhost/pcsds_api";
//initialize moment
moment().format("YYYY-MM-DD h:mm:ss");

var myAppModule = angular.module('pcsd_app', ['ngMaterial','ngAnimate', 'ngMessages','ngFileUpload','ngStorage','ngTable'])

.factory("$utils",function($http, $mdToast,$timeout){
   var f = {};
   f.api = function(q){
      $timeout(()=>{
        $http.get(api_address, {params: q.data} )
            .then(function(data){
              if(q.callBack!==undefined) q.callBack(data);
            },function (data) {
                  if(q.errorCallBack!==undefined){
                    q.errorCallBack(data);
                  }else {
                    $mdToast.show(
                      $mdToast.simple()
                        .textContent("You are OFFLINE!")
                        .hideDelay(4000)
                    );
                  } 
              }
            );
      },50);
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


    $scope.ngTable = function(d,c){
      if(c == undefined) c=10;
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
'use strict';


myAppModule.controller('dashboard_controller', function ($scope, $timeout, $utils, $mdToast,$mdDialog,NgTableParams) {
    
   
    

});
'use strict';
myAppModule.controller('user_management_controller', function ($scope, $timeout, $utils, $mdToast, NgTableParams) {
  var USER_DB = new JsonDB("DB/USERS", true, false);
  const user_string = "/users";

  try {
    USER_DB.getData(user_string + "[0]");
  } catch(error) {
    USER_DB.push(user_string,[]);
  };
  
  $scope.selected_user = {};
  $scope.is_single_user_selected = false;
  $scope.selectedIndex = 0;
  $scope.user_types = [
    {level:99,name:"Admin"},
    {level:0,name:"OJT"},
    {level:1,name:"Front Desk Staff"},
    {level:2,name:"Central Registry Staff"},
    {level:3,name:"ED Secretary"},
    {level:4,name:"Executive Director"},
    {level:5,name:"Permitting Staff"},
    {level:6,name:"Field Staff"},
    {level:7,name:"Permitting Chief"},
    {level:8,name:"Operations Director"}
  ];

  $scope.invalidate_table = ()=>{
    var data = USER_DB.getData(user_string);
    $scope.tbl_users =  new NgTableParams({sorting: { id: "desc" } }, { dataset: data });
  };

  $scope.get_users_by_level = (lvl)=>{
    return USER_DB.getData(user_string).filter(user => user.user_level == lvl );
  };
 
  $scope.download_users = ()=>{
    $scope.invalidate_table();
    var q = { 
        data : { 
            action : "user/get",
            user_id : $scope.user.id
        },
        callBack : (data)=>{
            if(data.data.status == 1){
              USER_DB.push(user_string,data.data.data);
                $scope.invalidate_table();
            }
        }
    };
    $utils.api(q);
  };
    
  $scope.add_new_user = function(d){
    var q = { 
      data : { 
        action : "user/add",
        id_number : d.id_number,
        user_key : d.user_key,
        data : d.data,
        user_level : d.user_level,
        user_id : $scope.user.id
      },
      callBack : function(data){
        if(data.data.status == 0){
          $scope.toast(data.data.error + "  : " + data.data.hint);
        }else {
          $scope.toast(data.data.data);
          $scope.download_users();
          $scope.selectedIndex = 0;
        }
      }
    };
    $utils.api(q);
  };

  $scope.activate_user = function(user_id){
    var q = { 
      data : { 
        action : "user/activate",
        id : user_id
      },
      callBack : function(data){
        if(data.data.status == 1){
          $scope.toast(data.data.data);
          $scope.download_users();
        }
      }
    };
    $utils.api(q);
  };

  $scope.update_selected_user = function(d){
    var q = { 
      data : { 
        action : "user/update",
        id : d.id,
        id_number : d.id_number,
        data : d.data,
        user_level : d.user_level,
        user_id : $scope.user.id
      },
      callBack : function(data){
        if(data.data.status == 0){
          $scope.toast(data.data.error + "  : " + data.data.hint);
        }else {
          $scope.is_single_user_selected = false;
          $scope.download_users();
          $scope.toast(data.data.data);
          $scope.selectedIndex = 0;
        }
      }
    };
    $utils.api(q);
  };
  
  $scope.open_selected_user = function(s){
    $scope.selected_user = s;
    $scope.is_single_user_selected = true;
  };

});
'use strict';

myAppModule.controller('document_management_controller', function ($scope, $timeout, $utils, $mdDialog, $interval) {
    var INCOMING_DB = new JsonDB("DB/INCOMING_DOCUMENTS", true, false);
    const documents_string = "/documents";
    const categ_string = "/categories";
    const assignee_string = "/assignee";
    const online_server_folder = "https://pcsd.gov.ph/igov/wp-admin/";

    try {
        INCOMING_DB.getData(documents_string + "[0]");
    } catch(error) {
        INCOMING_DB.push(documents_string,[]);
    };

    $scope.user = $scope.user || {};
    $scope.image_download_queue = [];
    $scope.attachment_download_queue = [];
    $scope.categ = [];
    $scope.user.wp_id = 32;
    $scope.update_queue = 0;

    $scope.PrintImage = (source)=>{
        let x = {
            img_url : source,
            view: "app/pages/document_management/single/image.html"
        };
        window.open('index.html?'+ $.param(x), 'modal');
    };

    $scope.categories = (v)=>{
        v = (v == undefined) ? 0 : v;
        let c = [];
        INCOMING_DB.getData(categ_string).forEach(element => {
            if(element.documents > v){
                c.push({id:element.id,title:element.value});
            }
        });
        return c;
    }

    $scope.document = (v)=>{
        return INCOMING_DB.getData(documents_string).filter(d => d.id == v )[0];
    }

    $scope.update_single_doc = (x)=>{
        if($scope.update_queue == 0){
            $scope.update_queue = 1;
            let q = { 
                data : { 
                    action : "document_management/document/get",
                    doc_id : x.id
                },
                callBack : function(data){
                    $scope.update_queue = 0;
                    if(data.data.status == 1){
                        var index = 0;
                        INCOMING_DB.getData(documents_string).forEach(element => {
                            if(element.id == x.id){
                                INCOMING_DB.push(documents_string + "["+index+"]",data.data.data);
                                x = data.data.data;
                                return;
                            }else {
                                index++;
                            }
                        });
                    }
                }
            };
            $utils.api(q);
        }
    }

    $scope.wp_user = (v)=>{
        let c = {};
        INCOMING_DB.getData(assignee_string).forEach(element => {
            if(element.wp_id == v)
                c = element;
        });
        return c;
    }

    $scope.assignee = (v)=>{
        let c = {};
        INCOMING_DB.getData(assignee_string).forEach(element => {
            if(element.id == v){
                c = element;
                return c;
            }
        });
        return c;
    }

    $scope.has_user = (meta)=>{
        let s = meta.value.split(",");
        return (s.length > 1) ? true : false;
    }

    $scope.get_assignee_from_action = (meta)=>{
        let s = meta.value.split(",");
        return (s.length > 1) ? $scope.assignee(s[1]) : null;
    }

    $scope.get_receipient_from_action = (meta)=>{
        let s = meta.value.split(",");
        return (s.length > 2) ? $scope.assignee(s[2]) : null;
    }

    $scope.open_document = (d)=>{
        let x = {doc_id : d.id,view: "app/pages/document_management/single/document.html"};
        window.open('index.html?'+ $.param(x), 'modal');
        // ipcRenderer.send('open_child_window','index.html?'+ $.param(x));
    };


    $scope.load_categories = ()=>{
        let q = { 
            data : { 
                action : "document_management/categories/get"
            },
            callBack : function(data){
                if(data.data.status == 1){
                    INCOMING_DB.push(categ_string,data.data.data);
                    $scope.categ = $scope.categories(0);
                }
            }
        };
        $utils.api(q);
    };

    $scope.load_assignee = ()=>{
        let q = { 
            data : { 
                action : "document_management/assignee/get"
            },
            callBack : function(data){
                if(data.data.status == 1){
                    INCOMING_DB.push(assignee_string,data.data.data);
                }
            }
        };
        $utils.api(q);
    };

    $scope.load_documents = ()=>{
        $scope.load_categories();
        $scope.load_assignee();
        let q = { 
            data : { 
                action : "document_management/document/count"
            },
            callBack : function(data){
                if(data.data.status == 1){
                    $scope.max_docs = data.data.data;
                    $timeout($scope.get_documents,50);
                }
            }
        };
        $utils.api(q);
    };

    $scope.invalidate_table = ()=>{
        let xx = INCOMING_DB.getData(documents_string);
        let d = [];
        for (let i = (xx.length - 1) ; i != 0; i--) {
            d.push(xx[i]);
        }
        $scope.tbl_documents =  $scope.ngTable(d);
        $scope.categ = $scope.categories();
    };

    $scope.get_documents = ()=>{
        var d = INCOMING_DB.getData(documents_string);
        var l = (d.length > 0)? d[d.length - 1].id : 0;
        var current_length = d.length;
        let q = { 
            data : { 
                action : "document_management/document/load",
                offset : current_length,
                last_id : l
            },
            callBack : function(data){
                if(data.data.status == 1){
                    INCOMING_DB.push(documents_string,data.data.data,false);
                    $scope.loading_value = ( (current_length + data.data.data.length) / $scope.max_docs ) * 100;
                    $timeout($scope.get_documents,50);
                }else {
                    $timeout($scope.invalidate_table,50);
                    $scope.is_loading = false;
                }
            },
            errorCallBack : ()=>{
                $timeout($scope.invalidate_table,50);
                $scope.is_loading = false;
            }
        };
        $utils.api(q);
    };

    $scope.is_downloading_image = (id)=>{
        return ($scope.image_download_queue[id] == true) ? true : false;
    }

    $scope.is_downloading_attachment = (id)=>{
        return ($scope.attachment_download_queue[id] == true) ? true : false;
    }

    $scope.download_single_image = function(img){
        let loc = 'downloads/' + img.address;
        let loc_array = loc.split("/");
        
        for (let i = 0; i < (loc_array.length - 1); i++) {
            let folder = "";
            for (let v = 0; v < (i + 1); v++) {
                folder += loc_array[v] + "/";
            }
            let dir = "./" + folder;
            if(!fs.existsSync(dir))
                fs.mkdirSync(dir);
        }
        
        $scope.image_download_queue[img.id] = true;
        download(online_server_folder + img.address, loc, function(){
            delete $scope.image_download_queue[img.id];
            $scope.$apply();
        });
    };

    $scope.download_single_attachment = (f)=>{
        let loc = 'downloads/' + f.address;
        let loc_array = loc.split("/");
        
        for (let i = 0; i < (loc_array.length - 1); i++) {
            let folder = "";
            for (let v = 0; v < (i + 1); v++) {
                folder += loc_array[v] + "/";
            }
            let dir = "./" + folder;
            if(!fs.existsSync(dir))
                fs.mkdirSync(dir);
        }
        
        $scope.attachment_download_queue[f.id] = true;
        download(online_server_folder + f.address, loc, function(){
            delete $scope.attachment_download_queue[f.id];
            $scope.$apply();
        });
    };

    $scope.reload_all_data = ()=>{
        INCOMING_DB.push(documents_string,[]);
        $scope.is_loading = true;
        $scope.loading_value = 0
        $scope.load_documents();
    }

});

'use strict';
myAppModule.controller('fuel_log_controller', function ($scope, $timeout, $utils, $mdDialog,$localStorage, $interval,$filter) {

    $scope.update_trip_ticket_form = false;
        $scope.ticket_clear = function(){
        $scope.new_ticket = {"data":{"passengers":[],"places":[]}};
        //document.getElementById("ngForm").reset();

        //$scope.form_new_document.$setPristine();
        };

        
    $scope.ticket_add = function(d){// write to Database
        console.log(d);
        
        console.log("month");
        //$scope.is_single_account_selected = true;
        var q = { 
            
            data : { 
                action : "fuel/add",
                trip_ticket_id : d.ticket_number,
                data : d.data

            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  //$scope.ticket_clear();
                  
                    
                  }
              }
            };
        $utils.api(q);

    }

    $scope.get_ticket_data = function(){
        //$scope.selected_account = s;
        var q = { 
            data : { 
                action : "fuel/get",

            },
            callBack : function(data){
                        $scope.ticket_data =  $scope.ngTable(data.data.data);
                        console.log($scope.ticket_data);
                }   
            };
            
            $utils.api(q);
    };


    $scope.update_trip_ticket_data = function(trip_ticket_data){
        $scope.update_trip_ticket_form = true;
        $scope.trip_ticket_ID = trip_ticket_data.trip_ticket_id;
        $scope.new_ticket = trip_ticket_data;
    }

    $scope.to_time = function(d){
        return $filter('date')(d, "hh:mm:ss a");
      };

    $scope.ticket_update = function(new_data){
        console.log(new_data);
        var q = { 
            
            data : { 
                action : "fuel/update_ticket",
                trip_ticket_id : new_data.trip_ticket_id,
                data : new_data.data

            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  //$scope.ticket_clear();
                  
                    
                  }
              }
            };
        $utils.api(q);

    }


    $scope.update_selected_user = function(d){
        
      };
});
'use strict';


myAppModule.controller('transactions_controller', function ($scope, $timeout, $utils, $mdToast,$mdDialog,NgTableParams) {
    
    var APPLICANT_DB = new JsonDB("DB/APPLICANTS", true, false);
    const applicant_string = "/applicants";
    var TRANSACTION_DB = new JsonDB("DB/TRANSACTIONS", true, false);
    const incoming_string = "/incoming";

    try {
        TRANSACTION_DB.getData(incoming_string + "[0]");
        APPLICANT_DB.getData(applicant_string + "[0]");
    } catch(error) {
        TRANSACTION_DB.push(incoming_string,[]);
        APPLICANT_DB.push(applicant_string,[]);
    };

    $scope.is_loading = false;
    $scope.is_single_loading = false;
    $scope.application_loading = false;
    $scope.update_queue = 0;
    $scope.opened_single = {};
    $scope.current_page_view = "app/pages/transactions/views/incoming_transactions.html";
    $scope.current_active_view = "incoming_transactions";
    $scope.dataSelector = "";
    $scope.my_transactions = [];

    $scope.change_current_view = (p)=>{
        $scope.current_page_view = "app/pages/transactions/views/" + p + ".html";
        $scope.current_active_view = p;
    }

    if($scope.user.user_level == '7' || '8' || '4' ){
        $scope.change_current_view('my_transactions');
    }

    $scope.invalidate_table = ()=>{
        let data = TRANSACTION_DB.getData(incoming_string);
        $scope.tbl_incoming =  new NgTableParams({sorting: { id: "desc" } }, { dataset: data });
    };

    $scope.set_application = (x)=>{
        $scope.application = x;
    }

    $scope.get_my_transactions = ()=>{
        $scope.user.user_level = parseInt($scope.user.user_level);
        var d = [];
        switch ($scope.user.user_level) {
            case 4:
                //executive director
                d = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == 5 ).reverse();
                break;
            case 5:
                //permitting staff
                d = TRANSACTION_DB.getData(incoming_string).filter(d => (d.status == 1) && (d.data.received.staff.id == $scope.user.id)  ).reverse();
                break;
            case 7:
                // permitting chief
                d = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == 3 ).reverse();
                break;
            case 8:
                //operations director
                d = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == 4 ).reverse();
                break;
            default:
                break;
        }
        return d;
    };

    $scope.invalidate_my_transactions = ()=>{
        $scope.my_transactions = $scope.get_my_transactions();
    }

    $scope.get_user_by_id = (id)=> {
        let data = USER_DB.getData(user_string);
        for (let x of data) {
            if(x.id == id) return x;
        }
        return undefined;
    }

    $scope.filter_incoming = (selector)=>{
        $scope.dataSelector = selector;
        if(selector == ""){
            $scope.invalidate_table();
        } else {
            let data = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == selector );
            $scope.tbl_incoming =  new NgTableParams({sorting: { id: "desc" } }, { dataset: data });
        }
    }

    $scope.open_single = (x,ev)=>{
        $scope.application = {};
        TRANSACTION_DB.getData(incoming_string).forEach(element => {
            if(element.id == x.id){
                $scope.application = element;
                $scope.showPrerenderedDialog(ev,'receiveSingleTransaction');
                return;
            }
        });
    }

    //$scope.filter_incoming($scope.dataSelector);
    $scope.db_changes = (DB,st,d,item,callBack)=>{
        let index = 0;
        DB.getData(st).forEach(element => {
            if(element.id == item.id){
                DB.push(st + "["+index+"]",d);
                // item = d;
                $timeout( ()=>{ if(callBack != undefined) callBack(); }, 200 );
                return;
            }else {
                index++;
            }
        });
    }

    $scope.update_single = (x)=>{
        if($scope.update_queue == 0){
            $scope.update_queue = 1;
            let q = { 
                data : { 
                    action : "applicant/transaction/get",
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.update_queue = 0;
                    if(data.data.status == 1){
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{$scope.filter_incoming($scope.dataSelector);});
                    }
                }
            };
            $utils.api(q);
        }
    }

    $scope.getTransactionStatus = (n)=>{
        if(n==0)return "New";
        if(n==1)return "On-Review";
        if(n==2)return "Declined";
        if(n==3)return "Proccesing";
        if(n==4)return "For Approval";
        if(n==5)return "For Acknowledgement";
        if(n==6)return "Acknowledged, Permit Complete";
        if(n==7)return "Used";
    };

    $scope.download_incoming = ()=>{
        $scope.invalidate_table();
        $scope.is_loading = true;
        let d = TRANSACTION_DB.getData(incoming_string);
        let l = (d.length > 0)? d[d.length - 1].id : 0;
        let current_length = d.length;
        let q = { 
            data : { 
                action : "applicant/transaction/load",
                offset : current_length,
                last_id : l,
                user_id : $scope.user.id
            },
            callBack : (data)=>{
                if(data.data.status == 1){
                    $scope.is_loading = false;
                    TRANSACTION_DB.push(incoming_string,data.data.data,false);
                    $timeout($scope.download_incoming,50);
                }else {
                    $timeout(()=>{ $scope.filter_incoming($scope.dataSelector); },100);
                    $scope.is_loading = false;
                }
            },
            errorCallBack : ()=>{
                $timeout(()=>{ $scope.filter_incoming($scope.dataSelector); },100);
                $scope.is_loading = false;
            }
        };
        $utils.api(q);
    };

    $scope.receive_single = (x)=>{
        $scope.is_single_loading = true;
        let q = { 
            data : { 
                action : "applicant/transaction/receive",
                id : x.id,
                staff_id : $scope.user.id
            },
            callBack : (data)=>{
                $scope.is_single_loading = false;
                if(data.data.status == 1){
                    $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{$scope.filter_incoming($scope.dataSelector);});
                    $scope.close_dialog();
                }
            },
            errorCallBack : ()=>{
                $scope.toast("OFFLINE, try again later...")
            }
        };
        $utils.api(q);
    }
    
    $scope.download_applicant = ()=>{
        let d = APPLICANT_DB.getData(applicant_string);
        let l = (d.length > 0)? d[d.length - 1].id : 0;
        let current_length = d.length;
        let q = { 
            data : { 
                action : "applicant/account/load",
                offset : current_length,
                last_id : l,
                user_id : $scope.user.id
            },
            callBack : (data)=>{
                if(data.data.status == 1){
                    APPLICANT_DB.push(applicant_string,data.data.data,false);
                    $timeout($scope.download_applicant,50);
                }
            }
        };
        $utils.api(q);
    };

    $scope.rejectApplication = (x,ev)=>{
        var confirm = $mdDialog.prompt()
            .title('Rejecting Application')
            .textContent('Reason')
            .placeholder('')
            .ariaLabel('Reason')
            .initialValue('')
            .targetEvent(ev)
            .required(true)
            .ok('Reject')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            $scope.application_loading = true;
            let q = { 
                data : { 
                    action : "applicant/transaction/reject",
                    remark : result,
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.application_loading = false;
                    if(data.data.status == 1){
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{
                            $scope.invalidate_my_transactions();
                        } );
                        $scope.application = undefined;
                    }else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function() {
            // cancel
        });
    }

    $scope.acceptApplication = (x,ev)=>{
        var confirm = $mdDialog.prompt()
            .title('Accepting Application')
            .textContent('Comment')
            .placeholder('')
            .ariaLabel('Comment')
            .initialValue('ok')
            .targetEvent(ev)
            .required(true)
            .ok('Accept and proceed to Approval')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            $scope.application_loading = true;
            let q = { 
                data : { 
                    action : "applicant/transaction/accept",
                    remark : result,
                    id : x.id,
                    user_id : $scope.user.id,
                    certificate_of_inspection : x.certificate_of_inspection,
                    payment_slip : x.payment_slip
                },
                callBack : (data)=>{
                    $scope.application_loading = false;
                    if(data.data.status == 1){
                        $scope.application = {};
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{
                            $scope.invalidate_my_transactions();
                        } );
                    }else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function() {
            // cancel
        });
    }

    $scope.approveApplication = (x,ev)=>{
        var confirm = $mdDialog.prompt()
            .title('Approve Application')
            .textContent('Comment')
            .placeholder('')
            .ariaLabel('Comment')
            .initialValue('ok')
            .targetEvent(ev)
            .required(true)
            .ok('approve')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            $scope.application_loading = true;
            let q = { 
                data : { 
                    action : "applicant/transaction/approve",
                    remark : result,
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.application_loading = false;
                    if(data.data.status == 1){
                        $scope.application = {};
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{
                            $scope.invalidate_my_transactions();
                        } );
                    }else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function() {
            // cancel
        });
    }

    $scope.recommendApplication = (x,ev)=>{
        var confirm = $mdDialog.prompt()
            .title('Recommend for Permit Releasing')
            .textContent('Comment')
            .placeholder('')
            .ariaLabel('Comment')
            .initialValue('ok')
            .targetEvent(ev)
            .required(true)
            .ok('recommend')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            $scope.application_loading = true;
            let q = { 
                data : { 
                    action : "applicant/transaction/recommend",
                    remark : result,
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.application_loading = false;
                    if(data.data.status == 1){
                        $scope.application = {};
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{
                            $scope.invalidate_my_transactions();
                        } );
                    }else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function() {
            // cancel
        });
    }

    $scope.acknowledgeApplication = (x,ev)=>{
        var confirm = $mdDialog.prompt()
            .title('Acknowledge Permit Releasing')
            .textContent('Comment')
            .placeholder('')
            .ariaLabel('Comment')
            .initialValue('ok')
            .targetEvent(ev)
            .required(true)
            .ok('acknowledged')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function(result) {
            $scope.application_loading = true;
            let q = { 
                data : { 
                    action : "applicant/transaction/acknowledge",
                    remark : result,
                    id : x.id,
                    user_id : $scope.user.id
                },
                callBack : (data)=>{
                    $scope.application_loading = false;
                    if(data.data.status == 1){
                        $scope.application = {};
                        $scope.db_changes(TRANSACTION_DB,incoming_string,data.data.data,x,()=>{
                            $scope.invalidate_my_transactions();
                        } );
                    }else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function() {
            // cancel
        });
    }

});
myAppModule.controller('jao_controller',function($scope,$localStorage, $utils,$http) 
{
    $scope.Accounting_JAO = $localStorage.Accounting_JAO || [];
    $scope.Accounting_JAO1 = $localStorage.Accounting_JAO1 || [];
    //$scope.Accounting_Year = $localStorage.Accounting_Year || [];
    $scope.Accounting_Year;
    $scope.Accounting_Month
    $scope.Accounting_DIVISION;
    $scope.Accounting_AllotClass;
  
    $scope.jaoBudgetMOOE_add = function(d,e){
        //var databudget = Object.assign(e.data,d.data);
       
        var q = { 
            
            data : { 
                action : "Accounting/jao/addBudget",
                Year : d.YearBudget,
                Division : d.divisionBudget,
                AllotmentClass: "Maintenance and Other Operating Expenses",
                Month : e.Month,
                data : e.data
                
            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  }
              }
            };
        $utils.api(q);

    }

    $scope.jaoBudgetPS_add = function(d,e){
        var databudget = Object.assign(e.data,d.data);
       
        var q = { 
            
            data : { 
                action : "Accounting/jao/addBudget",
                Year : d.YearBudget,
                Division : d.divisionBudget,
                AllotmentClass: "Personal Services",
                Month : e.Month,
                data : e.data
                
            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  }
              }
            };
        $utils.api(q);
    }

    $scope.jaoBudgetCO_add = function(d,e){
        
        
        var databudget = Object.assign(e.data,d.data);
       
        var q = { 
            
            data : { 
                action : "Accounting/jao/addBudget",
                Year : d.YearBudget,
                Division : d.divisionBudget,
                AllotmentClass: "Capital Overlay",
                Month : e.Month,
                data : e.data
                
            },
            callBack : function(data){
                  if(data.data.status == 0){
                  $scope.toast(data.data.error + "  : " + data.data.hint);
                  }
                  
                  else {
                  $scope.toast(data.data.data);
                  }
              }
            };
        $utils.api(q);

    }
    var typeclass;

    $http.get('app/pages/Accounting/JAO/data.json').then((data)=>{
       // console.log(data);
        $scope.jsondata = data.data;
        typeclass = data.data;

    });

    var aYear,aMonth,aDivision,aAllotClass;
    

    //$scope.Accounting_Month = $localStorage.Accounting_Month || [];

    $scope.trylang = function(){
        $scope.is_single_account_selected = true;
        $scope.open_view_Budget = true;
        $scope.disabled1 = true;
        $scope.disabled2 = true;
        $scope.disabled3 = true;

    };

    $scope.type_EDis = (s) =>{
        console.log(s);

        // $scope.selected_account = s;
        if(s == "Personal Services"){
            $scope.PST = typeclass.PS;
        }
        else if (s == "Maintenance and Other Operating Expenses"){
            $scope.PST = typeclass.MOOE;
        }
        else if (s == "Capital Overlay"){
            $scope.PST = typeclass.CO;
        }
         $scope.is_single_account_selected = false;
     };

    

    $scope.open_selected_account = () =>{
        //$scope.selected_account = s;
        //$scope.is_single_account_selected = false;

        $scope.ViewExpenses = $scope.templates[8];

        var q = { 
            data : { 
                action : "Accounting/jao/get",
                Month_Date : aMonth,
                Year_Date : aYear,
                DIVISION : aDivision,
                AllotmentClass : aAllotClass

            },
            callBack : function(data){
                       $localStorage.Accounting_JAO = $scope.JAO_List =  $scope.ngTable(data.data.data);
                       $localStorage.Accounting_JAO1 =  data.data.data;
                }   
            };
            $utils.api(q);
            
            $scope.YearData = aYear;
            $scope.MonthData = aMonth;
            $scope.DivisionData = aDivision;
            $scope.ACData = aAllotClass;
    };

    $scope.SData = function(d){
        //console.log(d);
        aYear = d;
        console.log(aYear);
        $scope.disabled1 = false;

        var q = { 
            data : { 
                action : "Accounting/jao/getMonth",
                //date : d
                Year_Date: d
                             
            },
            callBack : function(data){
                       $scope.Accounting_Month = data.data.data;
                }   
            };
            $utils.api(q);
            

    };

    $scope.DData = function(d){
        //console.log(d);
        aMonth = d;
        console.log(aMonth);
        $scope.disabled2 = false;

        var q = { 
            data : { 
                action : "Accounting/jao/getDivision",
                Month_Date : aMonth,
                Year_Date : aYear
                             
            },
            callBack : function(data){
                       $scope.Accounting_DIVISION = data.data.data;
                       
                }   
            };
            $utils.api(q);

    }

    $scope.EData = function(d){
        
        console.log(d);
        $scope.disabled3 = false;
        aDivision = d;

       
        var q = { 
            data : { 
                action : "Accounting/jao/getAllotClass",
                Month_Date : aMonth,
                Year_Date : aYear,
                DIVISION : aDivision
                             
            },
            callBack : function(data){
                       $scope.Accounting_AllotClass = data.data.data;
                       
                }   
            };
            $utils.api(q);
    }

    $scope.FData = function(d){
        console.log(d);
        aAllotClass = d;

    }

    

    $scope.get_year = function(){
        var q = { 
            data : { 
                action : "Accounting/jao/getYear",
                             
            },
            callBack : function(data){
                       $scope.Accounting_Year = data.data.data;
                       
                }   
            };
            $utils.api(q);
    };
    
    $scope.jao = {};
    
    $scope.jao_add = function(d){

        
        obj = JSON.parse(d.expenses);
        console.log(obj);
        console.log(obj.hello);
        
        month = $scope.to_month(d.data.date);
        year = $scope.to_year(d.data.date);
        var q = { 
            data : { 
                action : "Accounting/jao/getBudget",
                Year: year,
                Month: month,
                AllotmentClass: d.allotment,
                Division : d.division,
                             
            },
            callBack : function(data){

                      amount = data.data.data;

                      console.log(amount);
                      
                      var results = [];
                      
                      
                      for(var i = 0; i < amount.length; i++){//get amountbudget
                            results.push(amount[i].data.BuildingBudget);
                        }
                      console.log(results);
                        
                      var TotalBudget = 0;

                      for (var i  = 0; i < results.length; i++){//get totalamountbudget
                        TotalBudget  += results[i];
                      }
                        console.log(TotalBudget);

                     if(TotalBudget >= d.data.amount){
                            // document.getElementById("formreset").reset();
            
                            // d.data.date = $scope.to_date(d.data.date);
                            // 
                            // console.log("month");
                            // //$scope.is_single_account_selected = true;

                            // var t = { 
                                
                            //     data : { 
                            //         action : "Accounting/jao/add",
                            //         ObrNo : d.ObrNo,
                            //         data : d.data,
                            //         AllotmentClass : d.allotment,
                            //         Type_Expenses : d.expenses,
                            //         DIVISION : d.division,
                            //         Month_DATE : month,
                            //         Year_Date : year

                                    
                            //     },
                            //     callBack : function(data){
                            //         if(data.data.status == 0){
                            //         $scope.toast(data.data.error + "  : " + data.data.hint);
                            //         }
                                    
                            //         else {
                            //         $scope.toast(data.data.data);
                            //         $scope.jao = {data : {}}
                            //         }
                            //     }
                            // };
                            // $utils.api(t);
                            
                        console.log("Meron");
                     }
                     else{
                        console.log("Wala");
                     }

                }   
            };
        $utils.api(q);

    }

    $scope.get_jao = function(){
        
    };

    $scope.ShowSearchExpenses = function(){
        
        $scope.ViewExpenses = $scope.templates[7];

    }

    $scope.view_budget = function(){
        
        $scope.ViewExpenses = $scope.templates[9];

        var q = { 
            data : { 
                action : "Accounting/jao/getBudget",

            },
            callBack : function(data){
                        $scope.JAOBudget =  $scope.ngTable(data.data.data);
                        $scope.JaoBudgetlist = data.data.data;
                      
                }   
            };
        $utils.api(q);

        console.log(JAOBudget);


    }
    

    $scope.templates =
      [{ name: 'template1.html', url: './app/pages/Accounting/JAO/template1.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/template2.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AddExpenses.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AllotmentPages/PS.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AllotmentPages/MOOE.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AllotmentPages/CO.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AddBadget.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/viewExpenses.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/viewData.html'},
       { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/viewBudget.html'}];

    $scope.template = $scope.templates[0];
    $scope.AddExpenses = $scope.templates[2];
    $scope.AB_Allot_PS = $scope.templates[3];
    $scope.AB_Allot_MOOE = $scope.templates[4];
    $scope.AB_Allot_CO = $scope.templates[5];
    $scope.AddBudgets = $scope.templates[6];
    $scope.ViewExpenses = $scope.templates[7];
     


})
'use strict';
myAppModule.controller('database_admin_cases_controller', function ($scope, $timeout, $utils, $mdToast,$localStorage) {
    $scope.list_admin_cases = [
        { name : "Admin Order 5, Series 2014", value : "AO-5-2014" },
        { name : "Admin Order 6, Series 2014", value : "AO-6-2014" }
    ];

});
'use strict';

myAppModule.controller('database_permit_controller', function ($scope, $timeout, $utils, $mdToast,$localStorage) {
    var XLSX = require('xlsx');
    $scope.wsup_data = [];
    $scope.sep_data = [];
    $scope.apprehension_data = [];
    $scope.admin_cases_data = [];
    var uploading_type = '';
    $scope.is_loading = false;
    $scope.is_deleting = {value : false,type:''};
    var PERMITS_DB = new JsonDB("DB/PERMITS", true, false);

    $scope.permit_types = [
        {code:"wsup",name:"Wildlife Special Use Permit"},
        {code:"sep",name:"Strategic Environmental Plan (SEP) Permit"},
        {code:"apprehension",name:"PCSD Apprehension"},
        {code:"admin_cases",name:"PAB Admin Cases"}
                        ];
    $scope.permit_types.forEach(pt => {
        try {
            if(pt.code=='wsup') $scope.wsup_data = PERMITS_DB.getData("/"+pt.code);
            if(pt.code=='sep') $scope.sep_data = PERMITS_DB.getData("/"+pt.code);
            if(pt.code=='apprehension') $scope.apprehension_data = PERMITS_DB.getData("/"+pt.code);
            if(pt.code=='admin_cases') $scope.admin_cases_data = PERMITS_DB.getData("/"+pt.code);
        } catch(error) {
            PERMITS_DB.push("/"+pt.code,[]);
        };
    });

    $scope.get_data_scope = (t)=>{
        if(t=='wsup') return $scope.wsup_data;
        if(t=='sep') return $scope.sep_data;
        if(t=='apprehension') return $scope.apprehension_data;
        if(t=='admin_cases') return $scope.admin_cases_data;
    }

    $scope.initialize_data = (t)=>{
        let x = PERMITS_DB.getData("/"+t);
        return ( x.length > 0 ) ? x : [];
    }

    $scope.search_from_db = (q,t)=>{
        let x = PERMITS_DB.getData("/"+t);
        var results = [];
        x.forEach(element => {
            element.data.forEach(item => {
                let p = false;
                for (const key in item) {
                    if(item[key]==q) p = true;
                }
                if(p) results.push(item);
            });
        });
        return results;
    }

    $scope.check_empty = (t)=>{ return ( PERMITS_DB.getData("/"+t).length > 0 ) ? false : true }

    $scope.upload_excel = (f,t)=>{
        if(uploading_type != '') return null;
        if(typeof(f) == typeof([])){
            uploading_type = t;
            var f = f[0];
            var reader = new FileReader();
            reader.onload = function(e) {
                var data = e.target.result;
                data = new Uint8Array(data);
                let wb = XLSX.read(data, {type: 'array'});
                wb.SheetNames.forEach(element => {
                    if(t=='wsup') $scope.wsup_data.push({name : element, data : XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                    if(t=='sep') $scope.sep_data.push({name : element, data : XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                    if(t=='apprehension') $scope.apprehension_data.push({name : element, data : XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                    if(t=='admin_cases') $scope.admin_cases_data.push({name : element, data : XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                });
                uploading_type = '';
                PERMITS_DB.push("/"+t,[]);
            };
            reader.readAsArrayBuffer(f);
        }else {
            $scope.toast("file error");
        }
    }

    $scope.uploading_excel = (t)=>{
        return (uploading_type == t) ? true : false;
    }
    
    $scope.delete_excel = (t)=>{
        $scope.is_deleting = {value : true,type:t};
        let q = { 
            data : { 
                action : "database/permits/delete",
                type : t,
                user_id : $scope.user.id
            },
            callBack : (data)=>{
                $scope.is_deleting = {value : false,type:''};
                if(t=='wsup') {$scope.wsup_data.splice(0,$scope.wsup_data.length);}
                if(t=='sep') {$scope.sep_data.splice(0,$scope.sep_data.length);}
                if(t=='apprehension') {$scope.apprehension_data.splice(0,$scope.apprehension_data.length);}
                if(t=='admin_cases') {$scope.admin_cases_data.splice(0,$scope.admin_cases_data.length);}
                PERMITS_DB.push("/"+t,[]);
                let toast = (data.data.status == 0)? data.data.error : data.data.data;
                $scope.toast(toast);
            },
            errorCallBack : ()=>{
                $scope.toast("Offline, internet connection is needed for this function.");
            }
        };
        $utils.api(q);
    }

    $scope.cancel_excel = (t)=>{
        if(t=='wsup') $scope.wsup_data.splice(0,$scope.wsup_data.length);
        if(t=='sep') $scope.sep_data.splice(0,$scope.sep_data.length);
        if(t=='apprehension') $scope.apprehension_data.splice(0,$scope.apprehension_data.length);
        if(t=='admin_cases') $scope.admin_cases_data.splice(0,$scope.admin_cases_data.length);
    }

    var calculate_items = (d)=>{
        let i = 0;
        d.forEach(j => {
            i = i + j.data.length;
        });
        return i;
    }

    $scope.save_database = (d,t)=>{
        // $scope.is_loading = {value : true,type:t};
        // $scope.total_items = calculate_items(d);
        // $scope.pointer = 0;
        $scope.toast("Data saved");
        PERMITS_DB.push("/"+t,d);
        // var u = (sp,ip)=>{
        //     let q = { 
        //         data : { 
        //             action : "database/permits/add",
        //             data_name : d[sp].name,
        //             data_item : d[sp].data[ip],//JSON.stringify(),
        //             type : t,
        //             user_id : $scope.user.id
        //         },
        //         callBack : (data)=>{
        //             if(data.data.status == 1){
        //                 PERMITS_DB.push("/"+t+"["+sp+"]/data["+ip+"]/uploaded",true);
        //             }
        //             $scope.pointer = $scope.pointer + 1;
        //             if($scope.total_items == $scope.pointer){
        //                 $scope.is_loading = {value : false,type:''};
        //                 $scope.empty_data.wsup = false;
        //             }else {
        //                 try {
        //                     sp = ( d[sp].data.length == (ip + 1) ) ? (sp + 1) : sp;
        //                     ip = ( d[sp].data.length == (ip + 1) ) ? 0 : (ip + 1);
        //                 } catch (error) {
        //                     console.log(error);
        //                     sp = sp + 1;
        //                     ip = 0;
        //                 }
        //                 u(sp,ip);
        //             }
        //         },
        //         errorCallBack : ()=>{
        //             u(sp,ip);
        //         }
        //     };
        //     $utils.api(q);
        // };
        // u(0,0);
    }

    $scope.export_database_to_excel = (d,t)=>{
        ipcRenderer.send('save_workbook_as_excel',d);
    }

    $scope.open_database = (t)=>{
        $scope.open_window_view("app/pages/database/permits/single/sheets.html",t);
    };

    $scope.set_changed = (x)=>{
        $scope.changed = x;
    }

    $scope.check_loading = (t)=>{
        return ($scope.is_loading.value == true && $scope.is_loading.type == t);
    }

    $scope.check_deleting = (t)=>{
        return ($scope.is_deleting.value == true && $scope.is_deleting.type == t);
    }

});