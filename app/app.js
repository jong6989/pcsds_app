'use strict';
var app_version = 4;
var os = require('os');
var JsonDB = require('node-json-db');
const queryString = require('query-string');
const { ipcRenderer, shell } = require('electron');
const remote = require('electron').remote;
const app = remote.app;
var fs = require('fs');
var request = require('request');
var path = require('path');
var QRCode = require('qrcode');
const isOnline = require('is-online');
//twillio
const accountSid = 'ACe4baaac94c303c32abb9c5804affe7d8';
const authToken = '67efdbe7bf96924c2bf435b69df9530b';
const smsClient = require('twilio')(accountSid, authToken);
const dbFolder = (os.platform() == 'win32')? app.getPath('downloads') + '\\pcsd_app_db\\' : app.getPath('downloads') + '/pcsd_app_db/';

if(!fs.existsSync(dbFolder)){
  fs.mkdirSync(dbFolder);
}

var nodemailer = require('nodemailer');
var pcsdmailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bboyjong6989@gmail.com',
    pass: 'Pula6989~'
  }
});

var mailOptions = {
  from: 'steve@pcsd.gov.ph',
  to: 'b.boy_jong@yahoo.com',
  subject: 'Test email from NODE',
  text: 'Yeah!!! its legit!'
};

// pcsdmailer.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });


var download = (uri, filename, callback)=>{
  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
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
        if(err){
          if(q.errorCallBack!==undefined){
            return q.errorCallBack(err);
          }else {
            $mdToast.show(
              $mdToast.simple()
                .textContent("You are OFFLINE!")
                .hideDelay(4000)
            );
          }
        }else {
          if(httpResponse.statusCode == 200){
            var j = data;
            if(typeof j !== typeof {}){
              j = JSON.parse(data);
            }
            if(q.callBack!==undefined)q.callBack({data:j});
          }
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
.config(function($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    'self',
    'https://document-network.web.app/**'
  ]);
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
    $scope.is_loading = false;
    $scope.is_printing = false;
    $scope.app_settings = {};
    $scope.app_version_code = '1.1.0';
    $scope.downloadFolder = (os.platform() == 'win32')? app.getPath('downloads') + '\\brain_downloads\\' : app.getPath('downloads') + '/brain_downloads/';
    $scope.software_update_available = false;
    $scope.toggleLeft = buildDelayedToggler('left');
    $scope.toggleRight = buildToggler('right');

    $scope.download = (uri,fname)=>{
      download(uri,fname,null)
    }

    function updateDownload(version,address){
      if(address != undefined) {
        let loc_array = address.split("/");
        let filename = loc_array[(loc_array.length - 1)];
        let dir = $scope.downloadFolder + "brain_system_" + version;
        dir += (os.platform() == 'win32')? '\\': '/';
        let loc = dir + filename;

        if(!fs.existsSync($scope.downloadFolder)){
          fs.mkdirSync($scope.downloadFolder);
        }
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        if(!fs.existsSync(loc)){
          download(address, loc, function(){
            $scope.toast("New Software Update available!");
            $scope.software_update_available = true;
            $scope.$apply();
          });
          return false;
        } else {
          return true;
        }
      }else {
        return false;
      }
      
    }

    fire.db.settings.when('desktop', (data) => {
      $scope.app_settings = data;
      if(app_version !== data.version) {
        let downloadUrl = data.url[os.platform()];
        if(downloadUrl !== undefined) {
          $scope.software_update_available = updateDownload(data.version, data.download);
        }
      }else {
        $scope.software_update_available = false;
      }
      $scope.$apply();
    }, (err) => {
      console.log(err);
    });

    $scope.open_software_update_folder = () => {
      let dir = $scope.downloadFolder + "brain_system_" + $scope.app_settings.version;
      let loc_array = $scope.app_settings.download.split("/");
      let filename = loc_array[(loc_array.length - 1)];
      dir += ( (os.platform() == 'win32')? '\\': '/' ) + filename;
      shell.openItem(dir);
    };

    $scope.ngTable = function(d,c){
      if(c == undefined) c=100;
      return new NgTableParams({count:c}, { dataset: d});
    };

    $scope.change_page = function(p){
      $scope.content_page = "app/" + p + "/view.html";
      $scope.active_page = p;
      console.log(p);
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

    $scope.get_data = function(path,xDb){
      try {
        return xDb.getData(path);
      } catch(error) {
        return [];
      };
    };

    $scope.set_application = (d)=>{
      $scope.application = d;
    }

    $scope.open_window_view = function(v,d){
      console.log(v);
      console.log(d);
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

    $scope.get_window_width = function(){
      return $(window).width();
    };

    $scope.exportToExcel=function(Id,title){ 
        var exportHref=Excel.tableToExcel("#"+Id,title);
        $timeout(function(){location.href=exportHref;},100); // trigger download
    };
    $scope.date_from_now = function(a){
      var a = moment(a);
      return a.fromNow();
    };

    $scope.date_now = function(f){
      f = (f == undefined)? "YYYY-MM-DD HH:mm:ss": f;
      return moment().format(f);
    };

    $scope.to_year = function(d){
      return $filter('date')(d, "yyyy");
    }

    $scope.to_month = function(d){
      return $filter('date')(d, "MM");
    }
    $scope.get_full_date = function(date){
      return $filter('date')(date, "MMMM dd, yyyy");
    }
    $scope.get_full_month_name = function(date){
      return $filter('date')(date, "MMMM");
    }
    $scope.to_day = function(d){
      return $filter('date')(d, "dd");
    }

    $scope.toString = (collection, key) => {
      var values = key ? collection.map(item => item[key]) : collection;
      var slicedElements = values.slice(0, values.length - 1);
      var joined = slicedElements.join(', ') + ' and ' + values[values.length - 1];

      return joined;
    }
    $scope.to_day_of_month = function(date){
      if(!date) return "";

      var day = $filter('date')(date, "d");
      var suffix = "th";

      if(!day.startsWith("1")){
        if(day.endsWith("1"))
          suffix = "st";
        else if(day.endsWith("2"))
          suffix = "nd";
        else if(day.endsWith("3"))
          suffix = "rd";
      }

      if(day === "1")
        suffix = "st";

      return `${day}${suffix}`;
    }

    $scope.format = (date, formatString) => {
      if(!formatString) formatString = "YYYY-MM-DD";
      return moment(date).format(formatString);
    }
    
    $scope.toast = function(t){
      $mdToast.show(
        $mdToast.simple()
          .textContent(t)
          .hideDelay(4000)
      );
    };

    $scope.notify_me = (title,message,img)=>{
      let n = {title: title, body : message};
      if (img !== undefined) n.icon = img;
      return new window.Notification(title, n);
    };

    $scope.login_attempt = function(d){
      $scope.is_loading = true;
      var q = { 
        data : { 
          action : "user/login",
          id_number : d.id_number,
          key : d.key
        },
        callBack : function(data){
          $scope.is_loading = false;
          if(data.data.status == 0){
            $scope.toast(data.data.error + "  : " + data.data.hint);
          }else {
            $scope.current_view = $localStorage.current_view = data.data.data.main_view;
            $localStorage.page_content = data.data.data.page_content;
            $scope.change_page(data.data.data.page_content);
            $scope.user = $localStorage.pcsd_app_user = data.data.data.user;
            $localStorage.pcsd_menus = $scope.menus = data.data.data.menus;
          }
        },
        errorCallBack : function(err){
          $scope.is_loading = false;
          console.log(err);
          $scope.toast("Connection error...");
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
      // NOTIFICATION_DB.push(notif_string,[]);
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
        fullscreen: true,
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

    $scope.print = (t)=>{
      t = (t==undefined)? 1300:t;
      $timeout( ()=>{
        $window.print();
        $timeout( ()=>{
          $window.close();
        }, 500 );
      }, t );
    };

    $scope.run_initials = function(){
      if($localStorage.pcsd_app_user !== undefined && $localStorage.current_view !== undefined && $localStorage.content_page !== undefined){
        $scope.current_view = $localStorage.current_view;
        $scope.user = $localStorage.pcsd_app_user;
        $scope.menus = $localStorage.pcsd_menus;
        // $scope.menus.push({
        //   name : "Database",
        //   icon: 'fa-database',
        //   url: 'pages/database'
        // });
        $scope.change_page($localStorage.page_content);
      }else{
        $scope.current_view = "app/login/view.html";
      }

      // $scope.content_page = "app/doc/view.html";
      // $scope.current_view = "app/login/view.html";
      // $scope.content_page = "app/pages/database/view.html";
      // $scope.current_view = "app/templates/main.html";
      // $scope.content_page = "app/templates/templates/gratuitous/permit/create.html";
      // $scope.content_page = "app/templates/test/editor.html";
    };

    $scope.iframeHeight = $scope.get_window_height();
    $scope.iframeWidth = $scope.get_window_width();
    angular.element($window).bind('resize',function(){
      $scope.iframeHeight = $window.innerHeight;
      $scope.iframeWidth = $window.innerWidth;
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
      if(n==9)return "Legal Staff";
      if(n==10)return "Staff";
      if(n==11)return "Division Head";
      if(n==12)return "Department Head";
    };
  
    if(global.location.search == ""){
      $scope.run_initials();
    }else {
      $scope.user = $localStorage.pcsd_app_user;
      $scope.render_params = queryString.parse(global.location.search) ;
      $scope.current_view = $scope.render_params.view;
      $scope.render_params.data = $localStorage.params;
      $scope.is_printing = true;
    }

    $scope.load_html = (text,clas)=>{
      text = text.replace('<script>','<script');
      text = text.replace('</script>','/script>');
      text = text.replace('< script >','<script');
      text = text.replace('< /script >','/script>');
      text = text.replace('script>','script');
        $timeout(
            ()=>{
                $("."+clas).html( text );
            },50
        )
    }

    $scope.extract_images_from_html = (clas,id,duration)=>{
      setTimeout(()=>{
        let obj = $("."+id);
        let hrefs = $("."+clas).children("a");
        let list = {};
        obj.empty();
        for (let index = 0; index < hrefs.length; index++) {
          let h = hrefs[index].href;
          if(!list[h]){
            let x = h.split('.');
            let t = x[x.length -1];
            if(t == 'jpg'|| t == 'png' || t == 'jpeg'){
              var img = new Image();
              img.src = hrefs[index].href;
              img.style = 'width:100%;height:auto';
              obj.append(img);
            }
            list[h] = true;
          }
        }
      },duration);
    }

    $scope.validate_user = (ars)=>{
      var r = false;
      ars.forEach(element => {
          if($scope.user.user_level == element) r = true;
      });
      return r;
    };

    $scope.generate_qr_code = (id,text)=>{
      let canvas = document.getElementById(id);
      QRCode.toCanvas(canvas, text, function (error) {
        if (error) console.error(error);
      })
    };

    var signaturePad = [];
    $scope.generate_signature_field = (id,idx) => {
      let wrapper = document.getElementById(id);
      let canvas = wrapper.querySelector('canvas');
      signaturePad[idx] = new SignaturePad(canvas);
      $scope.signed = (i)=> {
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
    
    $scope.pcsd = {
      head: {
          full_name: "Nelson P. Devandera",
          position: "PCSDS Executive Director"
      }
    }
});
document.write(`<script src="./app/doc/controllers/gratuitous.js"></script>`);
