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
var path = require('path')
const isOnline = require('is-online');
//twillio
const accountSid = 'ACe4baaac94c303c32abb9c5804affe7d8';
const authToken = '67efdbe7bf96924c2bf435b69df9530b';
const smsClient = require('twilio')(accountSid, authToken);
const dbFolder = (os.platform() == 'win32') ? app.getPath('downloads') + '\\pcsd_app_db\\' : app.getPath('downloads') + '/pcsd_app_db/';

if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder);
}

var download = (uri, filename, callback) => {
    request.head(uri, function (err, res, body) {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};


const api_address = "https://brain.pcsd.gov.ph/api";
// const api_address = "http://localhost/pcsds_api";
//initialize moment
moment().format("YYYY-MM-DD h:mm:ss");

var myAppModule = angular.module('pcsd_app', ['ngMaterial', 'ngAnimate', 'ngMessages', 'ngFileUpload', 'ngStorage', 'ngTable'])

    .factory("$utils", function ($mdToast) {
        var f = {};
        f.api = (q) => {
            request.post(api_address + "/?", { form: q.data, json: true }, (err, httpResponse, data) => {
                if (err) {
                    if (q.errorCallBack !== undefined) {
                        return q.errorCallBack(err);
                    } else {
                        $mdToast.show(
                            $mdToast.simple()
                                .textContent("You are OFFLINE!")
                                .hideDelay(4000)
                        );
                    }
                } else {
                    if (httpResponse.statusCode == 200) {
                        var j = data;
                        if (typeof j !== typeof {}) {
                            j = JSON.parse(data);
                        }
                        if (q.callBack !== undefined) q.callBack({ data: j });
                    }
                }

            });
        };
        f.upload = (callback) => {
            var r = request.post(api_address + "/?", function optionalCallback(err, httpResponse, data) {
                if (callback !== undefined) callback(JSON.parse(data), httpResponse.statusCode);
            });
            return r.form();
        };
        return f;
    })
    .factory('Excel', function ($window) {
        var uri = 'data:application/vnd.ms-excel;base64,',
            template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style type="text/css"> .print-hide{display: none;} </style></head><body><table>{table}</table></body></html>',
            base64 = function (s) { return $window.btoa(unescape(encodeURIComponent(s))); },
            format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) };
        return {
            tableToExcel: function (tableId, worksheetName) {
                var table = $(tableId),
                    ctx = { worksheet: worksheetName, table: table.html() },
                    href = uri + base64(format(template, ctx));
                return href;
            },
            getExcel: function (input_id) {
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


    .controller('AppCtrl', function ($scope, $window, $filter, $http, $timeout, $mdSidenav, $log, $utils, $mdToast, $localStorage, $mdDialog, $location, Excel, NgTableParams) {
        $scope.$localStorage = $localStorage;
        $scope.page_title = "";
        $scope.current_view = "";
        $scope.content_page = "";
        $scope.active_page = "";
        $scope.active_menu = "";
        $scope.menus = [];
        $scope.api_address = api_address;
        $scope.is_loading = false;
        $scope.app_settings = {};
        $scope.app_version_code = '1.1.0';
        $scope.downloadFolder = (os.platform() == 'win32') ? app.getPath('downloads') + '\\brain_downloads\\' : app.getPath('downloads') + '/brain_downloads/';
        $scope.software_update_available = false;
        $scope.toggleLeft = buildDelayedToggler('left');
        $scope.toggleRight = buildToggler('right');

        $scope.download = (uri, fname) => {
            download(uri, fname, null)
        }

        function updateDownload(version, address) {
            if (address != undefined) {
                let loc_array = address.split("/");
                let filename = loc_array[(loc_array.length - 1)];
                let dir = $scope.downloadFolder + "brain_system_" + version;
                dir += (os.platform() == 'win32') ? '\\' : '/';
                let loc = dir + filename;

                if (!fs.existsSync($scope.downloadFolder)) {
                    fs.mkdirSync($scope.downloadFolder);
                }
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
                if (!fs.existsSync(loc)) {
                    download(address, loc, function () {
                        $scope.toast("New Software Update available!");
                        $scope.software_update_available = true;
                        $scope.$apply();
                    });
                    return false;
                } else {
                    return true;
                }
            } else {
                return false;
            }

        }

        fire.db.settings.when('desktop', (data) => {
            $scope.app_settings = data;
            if (app_version !== data.version) {
                let downloadUrl = data.url[os.platform()];
                if (downloadUrl !== undefined) {
                    $scope.software_update_available = updateDownload(data.version, data.download);
                }
            } else {
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
            dir += ((os.platform() == 'win32') ? '\\' : '/') + filename;
            shell.openItem(dir);
        };

        $scope.ngTable = function (d, c) {
            if (c == undefined) c = 100;
            return new NgTableParams({ count: c }, { dataset: d });
        };

        $scope.change_page = function (p) {
            $scope.content_page = "app/" + p + "/view.html";
            $scope.active_page = p;
            $localStorage.content_page = p;
            $scope.close_left_side();
        };

        $scope.to_date = function (d) {
            return $filter('date')(d, "yyyy-MM-dd");
        };

        $scope.isOpenRight = function () {
            return $mdSidenav('right').isOpen();
        };

        $scope.date_gap = function (a, b) {
            var x = moment(b);
            return x.from(a);
        };

        $scope.file_exist = (f) => {
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

        $scope.get_data = function (path, xDb) {
            try {
                return xDb.getData(path);
            } catch (error) {
                return [];
            };
        };

        $scope.set_application = (d) => {
            $scope.application = d;
        }

        $scope.open_window_view = function (v, d) {
            $localStorage.params = d;
            var x = { view: v, last_view: $scope.current_view };
            // localData.set('staff_current_view', v);
              window.open('index.html?'+ $.param(x), 'modal');
        };

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

        $scope.import_report = function (id) {
            Excel.getExcel(id, $scope);
        };

        $scope.get_window_height = function () {
            return $(window).height();
        };

        $scope.get_window_width = function () {
            return $(window).width();
        };

        $scope.exportToExcel = function (Id, title) {
            var exportHref = Excel.tableToExcel("#" + Id, title);
            $timeout(function () { location.href = exportHref; }, 100); // trigger download
        };
        $scope.date_from_now = function (a) {
            var a = moment(a);
            return a.fromNow();
        };

        $scope.date_now = function (f) {
            f = (f == undefined) ? "YYYY-MM-DD HH:mm:ss" : f;
            return moment().format(f);
        };

        $scope.to_year = function (d) {
            return $filter('date')(d, "yyyy");
        }

        $scope.to_month = function (d) {
            return $filter('date')(d, "MM");
        }

        $scope.toast = function (t) {
            $mdToast.show(
                $mdToast.simple()
                    .textContent(t)
                    .hideDelay(4000)
            );
        };

        $scope.notify_me = (title, message, img) => {
            let n = { title: title, body: message };
            if (img !== undefined) n.icon = img;
            return new window.Notification(title, n);
        };

        $scope.login_attempt = function (d) {
            $scope.is_loading = true;
            var q = {
                data: {
                    action: "user/login",
                    id_number: d.id_number,
                    key: d.key
                },
                callBack: function (data) {
                    $scope.is_loading = false;
                    if (data.data.status == 0) {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    } else {
                        $scope.current_view = $localStorage.current_view = data.data.data.main_view;
                        $localStorage.page_content = data.data.data.page_content;
                        $scope.change_page(data.data.data.page_content);
                        $scope.user = $localStorage.pcsd_app_user = data.data.data.user;
                        $localStorage.pcsd_menus = $scope.menus = data.data.data.menus;
                    }
                },
                errorCallBack: function (err) {
                    $scope.is_loading = false;
                    console.log(err);
                    $scope.toast("Connection error...");
                }
            };
            $utils.api(q);
        };

        $scope.logout = function () {
            $scope.current_view = "app/login/view.html";
            $scope.content_page = "";
            $localStorage.current_view = undefined;
            $localStorage.content_page = undefined;
            $localStorage.pcsd_app_user = undefined;
            $scope.user = undefined;
            //clear notifications
            // NOTIFICATION_DB.push(notif_string,[]);
        };

        $scope.set_page_title = function (t) {
            $scope.page_title = t;
        };

        $scope.isActive = function (path) {
            return ($scope.active_page == path) ? true : false;
        }

        $scope.set_selected_notif = (x) => {
            $scope.selected_notif = x;
        }

        $scope.showPrerenderedDialog = function (ev, ID) {
            $mdDialog.show({
                contentElement: '#' + ID,
                parent: angular.element(document.body),
                targetEvent: ev,
                fullscreen: true,
                clickOutsideToClose: true
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

        $scope.print = (t) => {
            t = (t == undefined) ? 1300 : t;
            $timeout(() => {
                $window.print();
                $timeout(() => {
                    $window.close();
                }, 500);
            }, t);
        };

        $scope.run_initials = function () {
            if ($localStorage.pcsd_app_user !== undefined && $localStorage.current_view !== undefined && $localStorage.content_page !== undefined) {
                $scope.current_view = $localStorage.current_view;
                $scope.user = $localStorage.pcsd_app_user;
                $scope.menus = $localStorage.pcsd_menus;
                // $scope.menus.push({
                //   name : "Database",
                //   icon: 'fa-database',
                //   url: 'pages/database'
                // });
                $scope.change_page($localStorage.page_content);
            } else {
                $scope.current_view = "app/login/view.html";
            }

            // $scope.current_view = "app/login/view.html";

        };

        $scope.iframeHeight = $scope.get_window_height();
        $scope.iframeWidth = $scope.get_window_width();
        angular.element($window).bind('resize', function () {
            $scope.iframeHeight = $window.innerHeight;
            $scope.iframeWidth = $window.innerWidth;
            $scope.$digest();
        });

        $scope.getUserType = function (n) {
            if (n == 99) return "Admin";
            if (n == 0) return "OJT";
            if (n == 1) return "Front Desk Staff";
            if (n == 2) return "Central Registry Staff";
            if (n == 3) return "ED Secretary";
            if (n == 4) return "Executive Director";
            if (n == 5) return "Permitting Staff";
            if (n == 6) return "Field Staff";
            if (n == 7) return "Permitting Chief";
            if (n == 8) return "Operations Director";
            if (n == 9) return "Legal Staff";
            if (n == 10) return "Staff";
            if (n == 11) return "Division Head";
            if (n == 12) return "Department Head";
        };

        if (global.location.search == "") {
            $scope.run_initials();
        } else {
            $scope.user = $localStorage.pcsd_app_user;
            $scope.render_params = queryString.parse(global.location.search);
            $scope.current_view = $scope.render_params.view;
            $scope.render_params.data = $localStorage.params;
        }

        $scope.load_html = (text, clas) => {
            text = text.replace('<script>', '<script');
            text = text.replace('</script>', '/script>');
            text = text.replace('< script >', '<script');
            text = text.replace('< /script >', '/script>');
            text = text.replace('script>', 'script');
            $timeout(
                () => {
                    $("." + clas).html(text);
                }, 50
            )
        }

        $scope.extract_images_from_html = (clas, id, duration) => {
            setTimeout(() => {
                let obj = $("." + id);
                let hrefs = $("." + clas).children("a");
                let list = {};
                obj.empty();
                for (let index = 0; index < hrefs.length; index++) {
                    let h = hrefs[index].href;
                    if (!list[h]) {
                        let x = h.split('.');
                        let t = x[x.length - 1];
                        if (t == 'jpg' || t == 'png' || t == 'jpeg') {
                            var img = new Image();
                            img.src = hrefs[index].href;
                            img.style = 'width:100%;height:auto';
                            obj.append(img);
                        }
                        list[h] = true;
                    }
                }
            }, duration);
        }

        $scope.validate_user = (ars) => {
            var r = false;
            ars.forEach(element => {
                if ($scope.user.user_level == element) r = true;
            });
            return r;
        };

        $scope.get_notifs = () => {
            // return NOTIFICATION_DB.getData(notif_string);
        };

        $scope.set_new_notif = () => {
            $scope.new_notif = ($scope.user.data.received_notifs == undefined) ? (($scope.notifs == undefined) ? 0 : $scope.notifs.length) : $scope.notifs.length - $scope.user.data.received_notifs;
        };

        $scope.set_notif = () => {
            $scope.notifs = $scope.get_notifs();
            $scope.set_new_notif();
        };
        $scope.load_notifs = () => {
            // if($scope.user != undefined){
            //   var d = NOTIFICATION_DB.getData(notif_string);
            //   var l = (d.length > 0)? d[d.length - 1].id : 0;
            //   var current_length = d.length;
            //   let q = { 
            //       data : { 
            //           action : "database/notification/load",
            //           offset : current_length,
            //           last_id : l,
            //           user_id : $scope.user.id
            //       },
            //       callBack : function(data){
            //           if(data.data.status == 1){
            //               NOTIFICATION_DB.push(notif_string,data.data.data,false);
            //               $timeout($scope.set_notif,200);
            //           }
            //           $timeout($scope.load_notifs,3000);
            //       }
            //   };
            //   $utils.api(q);
            // }
        };

        $scope.clear_notif = (n) => {
            // if($scope.new_notif > 0){
            //   $http.get(api_address + "?action=user/clear_notif&user_id=" + $scope.user.id + "&count=" + n ).then(function(data){
            //     $scope.user = $localStorage.pcsd_app_user = data.data.data;
            //     $scope.set_notif();
            //   });
            // }
        };


    })
    ;
'use strict';

// document.write(`<script src="./app/doc/settings.js"></script>`);
// document.write(`<script src="./app/doc/functions.js"></script>`);

myAppModule.controller('doc_controller', function ($scope, $timeout, $utils, $mdDialog, $mdSidenav, $localStorage, func) {
    $scope.doc_content = '';
    $scope.isLoading = true;
    $scope.isUploading = false;
    $scope.currentNavItem = 'Documents';
    $scope.currentDocSelected = 'draft';
    $scope.currentClicked = 'draft';
    $scope.currentItem = ($localStorage.currentItem == undefined) ? null : $localStorage.currentItem;
    $scope.currentSubItem = {};
    $scope.currentSubIndex = {};
    $scope.currentTransaction = {};
    $scope.myAgencies = [];
    $scope.otherAgencies = [];
    $scope.resultAccounts = [];
    $scope.agencyAccounts = [];
    $scope.filesTobeUploaded = [];
    $scope.myDrafts = ($localStorage.myDrafts == undefined) ? [] : $localStorage.myDrafts;
    $scope.myPublished = [];
    $scope.mySent = [];
    $scope.myReceived = [];
    $scope.myPending = [];
    $scope.doc_user_agencies = [];
    $scope.docTabsSelected = 0;
    $scope.n = {};
    const userId = `pcsd_${$scope.user.id}`; //id from pcsd web api , (php), that will be saved to accounts collection
    $scope.userId = userId;
    $scope.doc_user = ($localStorage.doc_user == undefined) ? { id: userId } : $localStorage.doc_user; //save data to local storage to remember last user
    $scope.document_types = [
        'generic', 'incoming', 'outgoing', 'Back-To-Office-Report', 'acommplishments', 'report', 'request'
    ];
    $scope.request_types = [
        'service', 'man power', 'data or e-file', 'report', 'file', 'information'
    ];
    $scope.dateA = '';
    $scope.dateB = '';
    func.$scope = $scope;

    // draft 
    doc.db.collection(documents).where("status", "==", "draft").where("publisher", "==", userId).onSnapshot(qs => {
        if (!qs.empty) {
            let r = qs.docs.map(d => {
                let o = d.data();
                o.id = d.id;
                return o;
            });
            $scope.myDrafts = $localStorage.myDrafts = r;
        } else {
            $localStorage.currentItem = undefined;
            $localStorage.myDrafts = [];
            $scope.myDrafts = [];
            if ($scope.currentClicked == 'draft')
                $scope.currentItem = null;
        }
    });

    //Published 
    doc.db.collection(documents).where("status", "==", "published").where("publisher", "==", userId).orderBy('meta.published_time', 'desc')
        .onSnapshot(qs => {
            if (!qs.empty) {
                let r = qs.docs.map(d => {
                    let o = d.data();
                    o.id = d.id;
                    return o;
                });
                $scope.myPublished = r;
            }
        });

    //pending
    doc.db.collection(doc_transactions).where('receiver', '==', $scope.userId).orderBy('time', 'desc').where('status', '==', 'pending')
        .onSnapshot(qs => {
            if (!qs.empty) {
                let a = qs.docs.map(
                    dx => {
                        let b = dx.data();
                        b.id = dx.id;
                        return b;
                    }
                );
                $scope.myPending = a;
            }
        });
    $scope.removeFromPending = (id) => {
        $scope.myPending = $scope.myPending.filter(i => (i.id != id));
    };

    //received
    doc.db.collection(doc_transactions).where('receiver', '==', $scope.userId).orderBy('received.time', 'desc').where('status', '==', 'received')
        .onSnapshot(qs => {
            if (!qs.empty) {
                let a = qs.docs.map(
                    dx => {
                        let b = dx.data();
                        b.id = dx.id;
                        return b;
                    }
                );
                $scope.myReceived = a;
            }
        });

    //sent
    doc.db.collection(doc_transactions).where('sender.id', '==', $scope.userId).orderBy('time', 'desc')
        .onSnapshot(qs => {
            if (!qs.empty) {
                let a = qs.docs.map(
                    dx => {
                        let b = dx.data();
                        b.id = dx.id;
                        return b;
                    }
                );
                $scope.mySent = a;
            }
        });

    $scope.getUserAccount = async (id, idx) => {
        let a = await doc.db.collection(acc).doc(id).get();
        let b = a.data();
        b.id = a.id;
        $scope.mySent[idx].sentUser = b;
    };

    $scope.getCurrentClicked = (c) => {
        return ($scope.currentClicked == c);
    };

    $scope.setLocal = (key, value) => {
        $localStorage[key] = value;
    };

    $scope.getLocal = (key) => {
        return $localStorage[key];
    };

    $scope.doc_init = () => {
        //imidiate display, to prevent loading
        if ($localStorage.doc_user !== undefined) {
            $scope.doc_content = 'app/doc/views/dashboard.html';
            // func.checkDraft((a,b) => {
            //     $scope.myDrafts = a;
            //     $scope.currentItem = b;
            //     $scope.currentClicked = 'draft';
            //     $scope.currentDocSelected = 'draft';
            // });
            $scope.isLoading = false;
        }
        //checking user if account activated
        doc.db.collection(acc).where('id', '==', userId).get().then(qs => {
            $scope.isLoading = false;
            if (qs.empty) {
                $scope.doc_content = 'app/doc/views/register.html';
            } else {
                $scope.doc_content = 'app/doc/views/dashboard.html';
                qs.forEach(doc => {
                    $scope.doc_user = $localStorage.doc_user = doc.data();
                    func.listenToAccountChange(doc.id, (a, b) => {
                        $scope.doc_user = a;
                        $scope.doc_user_agencies = b;
                        if ($scope.currentClicked == 'draft' && $scope.currentItem != undefined)
                            $scope.currentItem.agency = b[0];
                    });
                    return null;
                });
                // func.checkDraft((a,b) => {
                //     $scope.myDrafts = a;
                //     $scope.currentItem = b;
                //     $scope.currentClicked = 'draft';
                //     $scope.currentDocSelected = 'draft';
                // });
            }
        }).catch(() => {
            setTimeout($scope.doc_init, 3000);
        });
    };

    $scope.loadAgencies = () => {
        func.getAgencies($scope.doc_user.agencies, (a, b) => {
            $scope.myAgencies = a;
            $scope.otherAgencies = b;
        });
    };

    $scope.setAccount = (data) => {
        $scope.isLoading = true;
        data.id = userId;
        data.tags = data.name.split(' ');
        doc.db.collection(acc).doc(userId).set(data).then(() => {
            $scope.doc_content = 'app/doc/views/dashboard.html';
            $scope.isLoading = false;
        });
    };

    $scope.activeNav = (nav) => {
        $scope.currentClicked = 'draft';
        // $scope.currentItem = null;
        func.checkDraft((a, b) => {
            $scope.myDrafts = a;
            $scope.currentItem = b;
        });
        if (nav == 'Agencies') func.getAgencies($scope.doc_user.agencies, (a, b) => {
            $scope.myAgencies = a;
            $scope.otherAgencies = b;
        });
        $scope.togglePane();
    };

    $scope.togglePane = () => {
        $mdSidenav('dashSide').toggle();
    };

    $scope.clickAgencyItem = (x) => {
        $scope.currentClicked = 'agency';
        $scope.currentItem = $localStorage.currentItem = x;
        $scope.getAgencyAccounts(x.id);
        $scope.togglePane();
    };

    $scope.getAccounts = () => {
        doc.db.collection(acc)
            .get().then(qs => {
                let a = [];
                qs.forEach(doc => {
                    a.push(doc.data());
                });
                $scope.resultAccounts = a;
                $scope.$apply();
            });
    };

    $scope.getAgencyAccounts = (id) => {
        id = (id === undefined) ? $scope.currentItem.id : id;
        doc.db.collection(acc)
            .where('agencies', 'array-contains', id)
            .get().then(qs => {
                let a = [];
                qs.forEach(doc => {
                    a.push(doc.data());
                });
                $scope.agencyAccounts = a;
                $scope.$apply();
            });
    };

    $scope.hasId = (id, list) => {
        if (list == undefined) return false;
        return (list.includes(id));
    };

    $scope.addToAgency = (t) => {
        let u = $scope.currentSubItem;
        let a = $scope.currentItem;
        let n = {};
        t.active = true;
        n[a.id] = t;
        n['agencies'] = firebase.firestore.FieldValue.arrayUnion(a.id);
        doc.db.collection(acc).doc(u.id).update(n).then(() => {
            $scope.getAccounts();
            $scope.getAgencyAccounts();
        });
        doc.db.collection(agencies).doc(a.id).update({ "accounts": firebase.firestore.FieldValue.increment(1) });
        $scope.resultAccounts.splice($scope.currentSubIndex, 1);
        $scope.close_dialog();
        $scope.toast(`${u.name} is added to ${a.short_name}.`);
        setTimeout(() => {
            func.getAgencies($scope.doc_user.agencies, (a, b) => {
                $scope.myAgencies = a;
                $scope.otherAgencies = b;
            })
        }, 3000);
    };

    $scope.removeToAgency = (x, ev) => {
        var confirm = $mdDialog.confirm()
            .title(`Remove ${x.name} to ${$scope.currentItem.short_name}`)
            .textContent('are you sure?')
            .ariaLabel('sure')
            .targetEvent(ev)
            .ok('Yes, Remove now')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            doc.db.collection(acc).doc(x.id).update({
                "agencies": firebase.firestore.FieldValue.arrayRemove($scope.currentItem.id)
            }).then(() => {
                $scope.getAccounts();
                $scope.getAgencyAccounts();
            }).catch((err) => { console.log(err) });
            doc.db.collection(agencies).doc($scope.currentItem.id).update({ "accounts": firebase.firestore.FieldValue.increment(-1) });
        }, () => { });
    };

    $scope.openAddToAgency = (x, idx, evt) => {
        $scope.currentSubItem = x;
        $scope.currentSubIndex = idx;
        $scope.showPrerenderedDialog(evt, 'addToAgency');
    };

    $scope.openAddDraft = (evt) => {
        delete ($scope.n);
        delete ($scope.dateA);
        delete ($scope.dateB);
        let d = $scope.date_now('YYYY-MM-DD');
        $scope.dateA = d;
        $scope.dateB = d;
        $scope.n = { created: d, published: d, keywords: [], category: 'none', type: ($localStorage.currentDocType) ? $localStorage.currentDocType : 'generic' };
        $scope.showPrerenderedDialog(evt, 'addDraft');
    };

    $scope.createDraft = async (x) => {
        if ($scope.doc_user.id !== undefined) {
            x.publisher = $scope.doc_user.id;
            x.created_time = Date.now();
            x.status = 'draft';
            if ($scope.doc_user.categories === undefined || !$scope.doc_user.categories.includes(x.category)) {
                doc.db.collection(acc).doc($scope.doc_user.id)
                    .update({ "categories": firebase.firestore.FieldValue.arrayUnion(x.category) });
            }

            doc.db.collection(documents).add(x).then(ref => {
                $scope.currentItem.id = ref.id;
                doc.db.collection(documents).doc(ref.id).update({ "id": ref.id });
            });

            $scope.currentClicked = 'draft';
            $scope.currentItem = x;
            if ($scope.doc_user_agencies.length > 0) {
                $scope.currentItem.agency = $scope.doc_user_agencies[0];
            }
            $scope.close_dialog();
            $scope.toast(`Draft document created.`);
            $scope.myDrafts.push(x);
            $scope.myDrafts = $localStorage.myDrafts = await func.getMyDrafts();
        } else {
            $scope.toast("system error, please re-boot this app.")
        }

    };



    $scope.uploadFiles = async () => {
        $scope.filesTobeUploaded = await func.getFilesTobeUploaded();
        if ($scope.filesTobeUploaded.length > 0) {
            func.uploadFile($scope.filesTobeUploaded[0], () => { $scope.uploadFiles(); });
        }
    };
    $scope.uploadFiles();
    setTimeout($scope.uploadFiles, 10000);

    $scope.checkIfUploaded = (path) => {
        let r = true;
        $scope.filesTobeUploaded.forEach(f => {
            if (f.path === path) {
                r = f.uploaded;
            }
        });
        return r;
    };

    $scope.setCurrentItem = (x, t, c) => {
        $scope.currentItem = x;
        $scope.currentClicked = t;
        $scope.currentTransaction = c;
        $localStorage.currentItem = x;
    }

    $scope.updateCleanDocFiles = (id, cF) => {
        cF = cF.map(d => { delete (d['$$hashKey']); return d; })
        $scope.updateDocument(id, { 'files': cF });
    };


    $scope.changeCurrentDocType = (t) => {
        $scope.currentDocSelected = t;
    }

    $scope.check_pending = (evt) => {
        setTimeout(() => {
            if ($scope.myPending.length > 0) {
                $scope.showPrerenderedDialog(evt, 'pendingDocument');
            }
        }, 5000);

    };

});

// document.write(`<script src="./app/doc/controllers/files.js"></script>`);
// document.write(`<script src="./app/doc/controllers/draft.js"></script>`);
// document.write(`<script src="./app/doc/controllers/published.js"></script>`);
// document.write(`<script src="./app/doc/controllers/pending.js"></script>`);
// document.write(`<script src="./app/doc/controllers/actions.js"></script>`);

myAppModule.service('func', function ($utils, $localStorage) {
    var func = {};

    func.updateDoc = (id, data, callBack) => {
        doc.db.collection(documents).doc(id).update(data).then(callBack);
    };

    //Drafts
    func.getMyDrafts = async () => {
        let res = await doc.db.collection(documents).where("status", "==", "draft").where("publisher", "==", func.$scope.userId).get();
        let r = res.docs.map(doc => { let o = doc.data(); o.id = doc.id; return o; });
        return r;
    }

    func.getFilesTobeUploaded = async () => {
        let res = await doc.db.collection(acc).doc(func.$scope.userId).collection(offlineFiles).where("uploaded", "==", false).get();
        let d = res.docs.map(dx => {
            let o = dx.data();
            o.id = dx.id;
            return o;
        });
        return d;
    };

    func.listenToAccountChange = (id, callback) => {
        doc.db.collection(acc).doc(id).onSnapshot(async (d) => {
            $localStorage.doc_user = d.data();
            let c = [];
            if (!d.empty && $localStorage.doc_user.agencies != undefined) {
                await $localStorage.doc_user.agencies.map(async v => {
                    let a = await doc.db.collection(agencies).doc(v).get();
                    if (a.empty) {
                        $localStorage.doc_user_agencies = [];
                        return {};
                    } else {
                        let b = a.data();
                        b.id = a.id;
                        c.push(b);
                        return b;
                    }
                });
            }

            $localStorage.doc_user_agencies = c;
            callback(d.data(), c);
        });
    };

    func.getAgencies = async (x, callback) => {
        await doc.db.collection(agencies).get().then((qs) => {
            let a = [];
            let b = [];
            qs.forEach(dx => {
                let c = dx.data(); c.id = dx.id;
                if (x != undefined) {
                    if (x.agencies !== undefined) {
                        x.agencies.forEach(agc => {
                            if (dx.id == agc) {
                                a.push(c);
                            } else {
                                b.push(c);
                            }
                        });
                    } else {
                        b.push(c);
                    }
                } else {
                    b.push(c);
                }
            });
            callback(a, b);
        });
    };

    func.checkDraft = async (callback) => {
        $localStorage.myDrafts = await func.getMyDrafts();
        if ($localStorage.myDrafts.length > 0) {
            $localStorage.currentItem = func.$scope.myDrafts[0];
            func.$scope.createdDate = $localStorage.currentItem.created;
            func.$scope.pdate = $localStorage.currentItem.published;
        } else {
            $localStorage.currentItem = null;
        }
        callback($localStorage.myDrafts, $localStorage.currentItem);
    };

    func.refreshDocItem = (id, callback) => {
        doc.db.collection(documents).doc(id).get().then(dx => {
            let d = dx.data();
            if (d.status !== 'archived') {
                d.id = dx.id;
                $localStorage.currentItem = d;
                callback(d);
            }
        });
    };
    //Create a directory to "My Downloads" and make a copy of the selected file
    func.upload = (files, callBack, userId) => {
        let dateNow = new Date();
        const divider = (os.platform() == 'win32') ? '\\' : '/';
        const saveFolder = dateNow.getFullYear() + divider + (dateNow.getMonth() + 1) + divider + dateNow.getDate() + divider + userId + divider;
        if (!fs.existsSync(storageFolder)) {
            fs.mkdirSync(storageFolder);
        }
        if (!fs.existsSync(storageFolder + dateNow.getFullYear() + divider)) {
            fs.mkdirSync(storageFolder + dateNow.getFullYear() + divider);
        }
        if (!fs.existsSync(storageFolder + dateNow.getFullYear() + divider + (dateNow.getMonth() + 1) + divider)) {
            fs.mkdirSync(storageFolder + dateNow.getFullYear() + divider + (dateNow.getMonth() + 1) + divider);
        }
        if (!fs.existsSync(storageFolder + dateNow.getFullYear() + divider + (dateNow.getMonth() + 1) + divider + dateNow.getDate() + divider)) {
            fs.mkdirSync(storageFolder + dateNow.getFullYear() + divider + (dateNow.getMonth() + 1) + divider + dateNow.getDate() + divider);
        }
        if (!fs.existsSync(storageFolder + saveFolder)) {
            fs.mkdirSync(storageFolder + saveFolder);
        }
        files.forEach(f => {
            setTimeout(() => {
                let path = storageFolder + saveFolder + f.name;
                fs.copyFile(f.path, path, (err) => {
                    if (err) throw err;
                    doc.db.collection(acc).doc(userId).collection(offlineFiles).add({ "name": f.name, "path": saveFolder + f.name, "uploaded": false });
                    callBack(saveFolder + f.name, f.name);
                });
            }, 500);
        });
    }

    //uploads are to PCSD website , pcsd.gov.ph , with unlimited storage
    func.uploadFile = (f, callback) => {
        if (fs.existsSync(storageFolder + f.path)) {
            console.log(`uploading ${f.name}:`)
            let form = $utils.upload((data, code) => {
                console.log(`done ${code}:`);
                callback();
                if (code == 200) {
                    if (data.status == 1) {
                        doc.db.collection(acc).doc(func.$scope.userId).collection(offlineFiles).doc(f.id).update({ "uploaded": true });
                    } else {
                        func.$scope.toast("error uploading");
                        console.log(data);
                    }
                }
            });
            form.append('action', 'file/doc_upload');
            form.append('userPath', f.path);
            form.append('file', fs.createReadStream(storageFolder + f.path), { filename: f.name });
        }
    }

    return func;
});
// //  // Debug
// var doc_config = {
// 	apiKey: "AIzaSyDJnCE34jNQ8mfQAcBt1zlGj5CJZwaOYfM",
// 	authDomain: "pcsd-app.firebaseapp.com",
// 	databaseURL: "https://pcsd-app.firebaseio.com",
// 	projectId: "pcsd-app",
// 	storageBucket: "pcsd-app.appspot.com",
// 	messagingSenderId: "687215095072"
// };

//// Realese
var doc_config = {
    apiKey: "AIzaSyCELuc2f0_CcV35xeHid9-iFHU7hbrNPKg",
    authDomain: "document-network.firebaseapp.com",
    databaseURL: "https://document-network.firebaseio.com",
    projectId: "document-network",
    storageBucket: "document-network.appspot.com",
    messagingSenderId: "583848541283"
};

var docFire = firebase.initializeApp(doc_config, 'doc');

docFire.firestore().settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});
docFire.firestore().enablePersistence({ synchronizeTabs: true });

var doc = {};
doc.db = docFire.firestore();
doc.fun = docFire.functions();
const acc = 'accounts';
const agencies = 'agencies';
const documents = 'documents';
const doc_transactions = 'doc_transactions';
const offlineFiles = 'offlineFiles';
const storageFolder = (os.platform() == 'win32') ? app.getPath('downloads') + '\\document_network\\' : app.getPath('downloads') + '/document_network/';

'use strict';


myAppModule.controller('manual_controller', function ($scope, $timeout, $utils, $mdToast, $mdDialog) {
    $scope.selectedManualTabIndex = 0;

    $scope.setTab = (t) => {
        $scope.selectedManualTabIndex = t;
    }
});
'use strict';

myAppModule.controller('doc_ctrl_actions', function ($scope, $timeout, $utils, $mdToast, $mdDialog, func, $localStorage) {
    var download_queue = {};
    $scope.uploading_file = false;
    $scope.add_action = {};
    $scope.fileDivider = (os.platform() == 'win32') ? '\\' : '/';

    var actionDocId = '';

    $scope.init_doc = () => {
        if ($scope.currentNavItem == 'Documents' && $scope.currentDocSelected != 'draft') {
            $scope.currentItem.actions = [];
            $scope.documentItemListener = doc.db.collection(documents).doc($localStorage.currentItem.id).onSnapshot(dx => {
                $scope.currentItem = dx.data();
                $scope.currentItem.id = dx.id;
                $localStorage.currentItem = $scope.currentItem;
                actionDocId = $scope.currentItem.id;
                $scope.$apply();
            });
        } else {
            clearInterval(actions_interval);
        };
    };

    var actions_interval = null;
    actions_interval = setInterval(() => {
        if ($localStorage.currentItem == undefined) {
            clearInterval(actions_interval);
        } else if (actionDocId !== $localStorage.currentItem.id) {
            $scope.init_doc();
        }
    }, 300);

    $scope.dl_attachment = (address, dx) => {
        if (dx != undefined) {
            let loc_array = address.split("/");
            let filename = loc_array[(loc_array.length - 1)];
            let dir = storageFolder + dx.id;
            dir += $scope.fileDivider;
            let loc = dir + filename;
            if (!fs.existsSync(storageFolder)) {
                fs.mkdirSync(storageFolder);
            }
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            if (!fs.existsSync(loc)) {
                if (download_queue[loc] == undefined) {
                    download_queue[loc] = true;
                    download(address, loc, function () {
                        console.log("downloaded " + address);
                        delete (download_queue[loc]);
                    });
                }
            }
        }
    };

    $scope.openFolder = (id) => {
        shell.openItem(storageFolder + id);
    }

    $scope.isFolderExist = (id) => {
        return fs.existsSync(storageFolder + id);
    }


    $scope.uploadFiles = (files, id) => {
        var upload_file = (idx) => {
            $scope.uploading_file = true;
            let f = files[idx];
            var form = $utils.upload((data, code) => {
                $scope.uploading_file = false;
                if (code == 200) {
                    if (files.length == (idx + 1)) {
                        let m = `<a href="${api_address}/${data.data}" target="blank" download>${f.name}</a>`;
                        if ($scope.add_action[id] == undefined) $scope.add_action[id] = '';
                        $scope.add_action[id] += m + "<br>\n";
                    } else {
                        upload_file(idx + 1);
                    }
                }
            });
            form.append('action', 'user/upload_file');
            form.append('file', fs.createReadStream(f.path), { filename: f.name });
            form.append('user_id', $scope.userId);
        };
        if (files.length > 0) upload_file(0);
    };

    $scope.addAction = (txt) => {
        let o = {
            name: $scope.doc_user.name,
            time: Date.now(),
            date: $scope.date_now(),
            message: txt
        };
        doc.db.collection(documents).doc($localStorage.currentItem.id).update({
            'actions': firebase.firestore.FieldValue.arrayUnion(o)
        });
    };


});
'use strict';

myAppModule.controller('doc_ctrl_draft', function ($scope, $timeout, $utils, $mdToast, $mdDialog, func, $localStorage) {
    $scope.doc_user_agencies = ($localStorage.doc_user_agencies == undefined) ? [] : $localStorage.doc_user_agencies;
    func.$scope = $scope;
    $scope.createdDate = undefined;
    $scope.pdate = undefined;

    $scope.upload_file = (id, files, isRefresh) => {
        if (files !== undefined && id !== undefined) {
            func.upload(files, (url, fileName) => {
                $scope.uploadFiles();
                const fileObject = { "name": fileName, "url": api_address + '/uploads/' + url, "path": url, "opened": false };
                if ($scope.currentItem.files == undefined) {
                    $scope.currentItem.files = [];
                    $scope.currentItem.files.push(fileObject);
                    $scope.updateDocument(id, { 'files': $scope.currentItem.files });
                } else {
                    if (!isRefresh) {
                        $scope.currentItem.files.push(fileObject);
                        $scope.updateDocument(id, { 'files': $scope.currentItem.files });
                    }
                }
            }, $scope.userId);
        }
    };

    $scope.updateDocument = async (id, data) => {
        if (id !== undefined) {
            doc.db.collection(documents).doc(id).update(data).then(() => {
                func.refreshDocItem(id, (a) => {
                    $scope.currentItem = a;
                });
            });
            setTimeout(() => {
                func.refreshDocItem(id, (a) => {
                    $scope.currentItem = a;
                    $scope.$apply();
                });
            }, 300);
            $scope.myDrafts = await func.getMyDrafts();
        }
    };

    $scope.deleteDocFile = (id, x, ev) => {
        var confirm = $mdDialog.confirm()
            .title(`Remove File ${x.name}`)
            .textContent('are you sure?')
            .ariaLabel('sure')
            .targetEvent(ev)
            .ok('Yes, Remove now')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            $scope.currentItem.files = $scope.currentItem.files.filter(z => (z.path !== x.path))
                .map(d => { delete (d['$$hashKey']); return d; });
            $scope.updateDocument(id, { 'files': $scope.currentItem.files });
        }, () => { });
    };

    $scope.deleteDraft = (id, ev) => {
        var confirm = $mdDialog.confirm()
            .title(`Delete this Draft Document?`)
            .textContent('are you sure?')
            .ariaLabel('sure')
            .targetEvent(ev)
            .ok('Yes, Delete now')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            $scope.currentItem = null;
            $scope.updateDocument(id, { 'status': 'archived' });
        }, () => { });
    };

    $scope.publishDraft = (item, ev) => {
        var confirm = $mdDialog.confirm()
            .title(`Publish this Draft Document?`)
            .textContent('are you sure?')
            .ariaLabel('sure')
            .targetEvent(ev)
            .ok('Yes, Publish now')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            let meta = { 'published_date': $scope.date_now('YYYY-MM-DD'), 'published_time': Date.now() };
            let u = { 'status': 'published', 'meta': meta, 'agency': item.agency };
            doc.db.collection(documents).doc(item.id).update(u);
            $scope.currentItem.status = 'publish';
            $scope.currentItem.meta = meta;
            $scope.setCurrentItem($scope.currentItem, 'published');
        }, () => { });
    };

    $scope.openFile = (id, path, cF) => {
        $scope.updateCleanDocFiles(id, cF);
        shell.openItem(storageFolder + path);
    };

    $scope.refreshFile = (id, x, cF) => {
        $scope.updateCleanDocFiles(id, cF);
        let newPath = {};
        newPath = Object.create(x);
        newPath.path = storageFolder + x.path;
        $scope.upload_file(id, [newPath], true);
    };

});
'use strict';

myAppModule.controller('doc_ctrl_files', function ($scope, $timeout, $utils, $mdToast, $mdDialog) {
    const userId = $scope.userId;
    $scope.fileLogs = [];

    doc.db.collection(acc).doc(userId).collection(offlineFiles).onSnapshot(qs => {
        let res = qs.docs.map(doc => { let x = doc.data(); x.id = doc.id; return x; });
        $scope.fileLogs = res;
    });
});
'use strict';

myAppModule.controller('doc_ctrl_pending', function ($scope, $timeout, $utils, $mdToast, $mdDialog, func, $localStorage) {

    $scope.receiveDocument = (evt) => {
        var confirm = $mdDialog.confirm()
            .title(`Mark this document as received?`)
            .textContent('are you sure?')
            .ariaLabel('sure')
            .targetEvent(evt)
            .ok('I received this document')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(() => {
            $scope.close_dialog();
            doc.db.collection(doc_transactions).doc($scope.currentTransaction.id).update({
                status: 'received',
                received: {
                    date: $scope.date_now(),
                    time: Date.now()
                }
            }).then(() => {
                $scope.removeFromPending($scope.currentTransaction.id);
                $scope.toast('Document marked as received!');
            });
            setTimeout(() => {
                $scope.setCurrentItem($scope.currentItem, 'received', $scope.currentTransaction);
            }, 200);
        }, () => { });
    };

    $scope.declineDocument = (evt) => {
        var confirm = $mdDialog.prompt()
            .title('Declining this request.')
            .textContent('why?')
            .placeholder('reason')
            .ariaLabel('Reason')
            .initialValue('Duplicate')
            .targetEvent(evt)
            .required(true)
            .ok('Confirm')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function (result) {
            $scope.close_dialog();
            doc.db.collection(doc_transactions).doc($scope.currentTransaction.id).update({
                status: 'declined',
                declined: {
                    date: $scope.date_now(),
                    time: Date.now(),
                    reason: result
                }
            }).then(() => {
                $scope.toast('Document declined!');
            });
            $scope.removeFromPending($scope.currentTransaction.id);
            setTimeout(() => {
                $scope.setCurrentItem(undefined, 'draft', undefined);
            }, 200);
        }, () => { });
    };

});
'use strict';

myAppModule.controller('doc_ctrl_published', function ($scope, $timeout, $utils, $mdToast, $mdDialog, func, $localStorage) {
    $scope.receipients = ($localStorage.doc_receipients) ? $localStorage.doc_receipients : [];
    $scope.filtered_receipients = [];
    $scope.reciepientList = [];
    $scope.currentReciepients = [];
    $scope.sendingRemarks = '';
    var currentDisplayedDocument = null;
    $scope.send_as = $localStorage.doc_send_as;
    func.$scope = $scope;

    $scope.loadReciepients = (a, b) => {
        doc.db.collection(acc).where(`${b}.active`, "==", true).onSnapshot(qs => {
            if (!qs.empty) {
                let r = qs.docs.map(d => {
                    let o = d.data();
                    o.id = d.id;
                    return o;
                });
                $scope.receipients = r;
                $localStorage.doc_receipients = r;
                $scope.$apply();
            } else {
                $localStorage.doc_receipients = [];
            }
        });
        for (const k in a) {
            if ($localStorage.doc_send_as == undefined) {
                $localStorage.doc_send_as = k;
                $scope.send_as = k;
            }
        }
    };

    $scope.openSendDocument = (item, evt) => {
        $scope.showPrerenderedDialog(evt, 'sendDocument');
    };

    $scope.filterReciepient = () => {
        let currentItem = $scope.currentItem;
        if (currentItem != undefined) {
            $scope.filtered_receipients = [];
            $scope.filtered_receipients = $scope.receipients.filter(a => {
                if (!a[currentItem.agency.id]['active']) {
                    return false;
                }
                if ($scope.send_as == 'front_office' || $scope.send_as == 'registry') {
                    return (a[currentItem.agency.id]['staff'] || a[currentItem.agency.id]['office_head'] || a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['division_head'] || a[currentItem.agency.id]['department_head'] || a[currentItem.agency.id]['registry']);
                } else if ($scope.send_as == 'division_head') {
                    return (a[currentItem.agency.id]['staff'] || a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['division_head'] || a[currentItem.agency.id]['department_head'] || a[currentItem.agency.id]['registry']);
                } else if ($scope.send_as == 'office_head') {
                    return (a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['department_head'] || a[currentItem.agency.id]['office_head'] || a[currentItem.agency.id]['registry']);
                } else if ($scope.send_as == 'department_head') {
                    return (a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['department_head'] || a[currentItem.agency.id]['office_head'] || a[currentItem.agency.id]['division_head'] || a[currentItem.agency.id]['registry']);
                } else if ($scope.send_as == 'admin') {
                    return true;
                } else if ($scope.send_as == 'staff') {
                    return (a[currentItem.agency.id]['front_office'] || a[currentItem.agency.id]['staff'] || a[currentItem.agency.id]['division_head']);
                }
                return false;
            });
        }
    };

    $scope.sendAsSelected = (a) => {
        $scope.reciepientList = [];
        $localStorage.doc_send_as = a;
        setTimeout($scope.filterReciepient, 200);
    };

    $scope.backToDraft = (item, ev) => {
        var confirm = $mdDialog.confirm()
            .title(`Pulling Back to Draft.`)
            .textContent('All data and connections will be reset to DRAFT state.')
            .ariaLabel('backt to draft')
            .targetEvent(ev)
            .ok('I understand the risk, pull back now!')
            .cancel('Cancel');
        $mdDialog.show(confirm).then(async () => {
            let u = { 'status': 'draft', 'meta': {} };
            doc.db.collection(documents).doc(item.id).update(u);
            item.status = 'draft';
            $scope.setCurrentItem($scope.currentItem, 'draft');
            console.log($scope.currentClicked, $scope.currentDocSelected);
        }, () => { });
    };

    $scope.previewFile = (path) => {
        shell.openItem(storageFolder + path);
    };

    $scope.sendThisDocument = (item, reciepients, r) => {
        let remarks = r;
        //create transactions
        reciepients.map(a => {
            let accessTypes = [];
            for (const k in $scope.doc_user[item.agency.id]) {
                accessTypes.push(k);
            }
            doc.db.collection(doc_transactions).add({
                document: item,
                status: 'pending',
                sender: {
                    id: $scope.doc_user.id,
                    contact: ($scope.doc_user.contact == undefined) ? '' : $scope.doc_user.contact,
                    email: ($scope.doc_user.email == undefined) ? '' : $scope.doc_user.email,
                    info: ($scope.doc_user.info == undefined) ? '' : $scope.doc_user.info,
                    access: accessTypes,
                    name: $scope.doc_user.name
                },
                receiver: a,
                'remarks': remarks,
                time: Date.now(),
                date: $scope.date_now()
            });
            //update document for current receipients
            doc.db.collection(documents).doc(item.id).update({
                last_sent_time: Date.now(),
                receipients: firebase.firestore.FieldValue.arrayUnion(a)
            });
            return a;
        });
        setTimeout(() => {
            $scope.toast(`Sent to ${reciepients.length} receipient${(reciepients.length > 1) ? 's' : ''}.`);
        }, 1000);

        //close and reset variables
        $scope.reciepientList = [];
        $scope.sendingRemarks = '';
        $scope.close_dialog();
    };

    $scope.load_current_receipients = (r) => {
        if (r != undefined) {
            currentDisplayedDocument = $scope.currentItem.id;
            delete ($scope.currentReciepients);
            $scope.currentReciepients = [];
            r.forEach(receiver_id => {
                doc.db.collection(acc).doc(receiver_id).get().then(dx => {
                    let a = dx.data();
                    a.id = dx.id;
                    a.sentItems = [];
                    $scope.currentReciepients.push(a);
                    doc.db.collection(doc_transactions).where('receiver', '==', receiver_id)
                        .where('document.id', '==', $scope.currentItem.id)
                        .where('sender.id', '==', $scope.userId)
                        .get()
                        .then(qs => {
                            qs.forEach(
                                dy => {
                                    let b = dy.data();
                                    b.id = dy.id;
                                    $scope.currentReciepients = $scope.currentReciepients.map(
                                        c => {
                                            if (c.id == b.receiver)
                                                c.sentItems.push(b);
                                            return c;
                                        }
                                    );
                                }
                            );
                        });
                });
            });
        }
    };

    var publishing_receipients_interval = null;
    $scope.init_publishing_receipients = () => {
        $scope.load_current_receipients($scope.currentItem.receipients);
        publishing_receipients_interval = setInterval(() => {
            if (currentDisplayedDocument != $scope.currentItem.id && $scope.currentItem.receipients != undefined)
                $scope.load_current_receipients($scope.currentItem.receipients);
            if ($scope.currentItem.receipients == undefined)
                clearInterval(publishing_receipients_interval);
        }, 400);
    };

});
'use strict';

myAppModule.controller('user_management_controller', function ($scope, $mdDialog, $utils, $mdToast, NgTableParams) {
    var USER_DB = new JsonDB(dbFolder + "USERS", true, false);
    const user_string = "/users";

    try {
        USER_DB.getData(user_string + "[0]");
    } catch (error) {
        USER_DB.push(user_string, []);
    };

    $scope.selected_user = {};
    $scope.is_single_user_selected = false;
    $scope.selectedIndex = 0;
    $scope.user_types = [
        { level: 99, name: "Admin" },
        { level: 0, name: "OJT" },
        { level: 1, name: "Front Desk Staff" },
        { level: 2, name: "Central Registry Staff" },
        { level: 3, name: "ED Secretary" },
        { level: 4, name: "Executive Director" },
        { level: 5, name: "Permitting Staff" },
        { level: 6, name: "Field Staff" },
        { level: 7, name: "Permitting Chief" },
        { level: 8, name: "Operations Director" },
        { level: 9, name: "Legal Staff" },
        { level: 10, name: "Staff" },
        { level: 11, name: "Division Head" },
        { level: 12, name: "Department Head" }
    ];

    $scope.invalidate_table = () => {
        var data = USER_DB.getData(user_string);
        $scope.tbl_users = new NgTableParams({ sorting: { id: "desc" }, count: 100 }, { dataset: data });
    };

    $scope.get_users_by_level = (lvl) => {
        return USER_DB.getData(user_string).filter(user => user.user_level == lvl);
    };

    $scope.get_users = () => {
        return USER_DB.getData(user_string);
    };

    $scope.get_user = (id) => {
        return USER_DB.getData(user_string).filter(user => user.id == id)[0];
    };

    $scope.download_users = () => {
        $scope.invalidate_table();
        var q = {
            data: {
                action: "user/get",
                user_id: $scope.user.id
            },
            callBack: (data) => {
                if (data.data.status == 1) {
                    USER_DB.push(user_string, data.data.data);
                    $scope.invalidate_table();
                }
            }
        };
        $utils.api(q);
    };

    $scope.add_new_user = function (d) {
        var q = {
            data: {
                action: "user/add",
                id_number: d.id_number,
                user_key: d.user_key,
                data: d.data,
                user_level: d.user_level,
                user_id: $scope.user.id
            },
            callBack: function (data) {
                if (data.data.status == 0) {
                    $scope.toast(data.data.error + "  : " + data.data.hint);
                } else {
                    $scope.toast(data.data.data);
                    $scope.download_users();
                    $scope.selectedIndex = 0;
                }
            }
        };
        $utils.api(q);
    };

    $scope.activate_user = function (user_id) {
        var q = {
            data: {
                action: "user/activate",
                id: user_id
            },
            callBack: function (data) {
                if (data.data.status == 1) {
                    $scope.toast(data.data.data);
                    $scope.download_users();
                }
            }
        };
        $utils.api(q);
    };

    $scope.change_password = (d, ev) => {
        var confirm = $mdDialog.prompt()
            .title(`${d.data.first_name} ${d.data.last_name}`)
            .textContent('Change password.')
            .placeholder('password')
            .ariaLabel('Change password')
            .initialValue('')
            .targetEvent(ev)
            .required(true)
            .ok('Change')
            .cancel('Close');

        $mdDialog.show(confirm).then(function (result) {
            var q = {
                data: {
                    action: "user/change_pass",
                    id: d.id,
                    password: result
                },
                callBack: function (data) {
                    if (data.data.status == 0) {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    } else {
                        $scope.toast(data.data.data);
                    }
                }
            };
            $utils.api(q);
        }, function () {
            //
        });
    };

    $scope.update_selected_user = function (d) {
        var q = {
            data: {
                action: "user/update",
                id: d.id,
                id_number: d.id_number,
                data: d.data,
                user_level: d.user_level,
                user_id: $scope.user.id
            },
            callBack: function (data) {
                if (data.data.status == 0) {
                    $scope.toast(data.data.error + "  : " + data.data.hint);
                } else {
                    $scope.is_single_user_selected = false;
                    $scope.download_users();
                    $scope.toast(data.data.data);
                    $scope.selectedIndex = 0;
                }
            }
        };
        $utils.api(q);
    };

    $scope.open_selected_user = function (s) {
        $scope.selected_user = s;
        $scope.is_single_user_selected = true;
    };

});
'use strict';

myAppModule.controller('applications_controller', function ($scope, $timeout, $utils, $mdDialog, $mdSidenav, $http) {
    $scope.application_list = [];
    $scope.pending_list = [];
    $scope.staff_list = [];
    $scope.log_list = [];
    $scope.client_chat_list = [];
    $scope.client_chat_count = 0;
    $scope.api_address = api_address;
    $scope.selectedTab = 0;
    $scope.tabs = {};
    $scope.chatNav = {};
    $scope.add_tread_message = {};
    $scope.pc_tread_message = {};
    $scope.cc_tread_message = {};
    $scope.group_tread_message = {};
    $scope.is_online = false;
    $scope.is_loading = false;
    $scope.me = { doc_id: $scope.user.id };
    $scope.my_chats = { personal: {}, others: {} };

    let ti = 60 * 1000;
    let th = 60 * ti;
    let td = 24 * th;
    let tm = 30 * td;
    let ty = 12 * tm;
    const online_laps = 30000;
    var opc = {};
    var initials = {};
    var applicationListener = null;
    var download_queue = {};
    var notifChatRecord = {};

    $scope.getTransactionStatus = (n) => {
        if (n == 0) return "New";
        if (n == 1) return "Received";
        if (n == 2) return "Declined";
        if (n == 3) return "On-Process";
        if (n == 4) return "On-Review";
        if (n == 5) return "For Recommendation";
        if (n == 6) return "Approved";
        if (n == 7) return "Used";
    };

    $scope.tabsHasContent = () => {
        let res = false;
        for (const key in $scope.tabs) {
            res = true;
        }
        return res;
    }

    function trigerLoading() {
        $scope.is_loading = true;
        $timeout(() => { $scope.is_loading = false; }, 4000);
    }

    // fire.db.staffs.query.where("id","==",$scope.user.id).get().then(qs=>{
    //     qs.forEach(doc=>{
    //         $scope.me = doc.data();
    //         $scope.me.doc_id = doc.id;
    //     })
    // });

    fire.db.staffs.when($scope.user.id, (res) => {
        // if(res.badges.personal_chat > 0) {
        //     $scope.toast('New chat conversation..')
        // }
        // if(res.badges.group_chat > 0) {
        //     $scope.toast('New group chat conversation..')
        // }
        $scope.me = res;
        $scope.me.doc_id = res.id;
    });

    $scope.update_user = (data) => {
        fire.db.staffs.query.doc($scope.me.doc_id).update(data);
    };

    fire.db.staffs.query.doc($scope.user.id).collection("logs").onSnapshot(qs => {
        let d = [];
        qs.forEach(x => {
            let dx = x.data();
            dx.id = x.id;
            d.push(dx);
        });
        $scope.log_list = d;
    });

    $scope.send_sms = (number, message) => {
        let n = number.length;
        console.log(n);
        if (n >= 11 || n <= 13) {
            if (n == 11) number = "+63" + number.substr(1);
            console.log(n);
            smsClient.messages
                .create({
                    body: message,
                    from: '+18577633830',
                    to: number
                })
                .then(message => console.log(message.sid), error => {
                    console.log(error)
                });
        } else {
            $scope.toast("invalid mobile number");
        }
    }

    $scope.download_attachment = (server, address, application) => {
        if (application != undefined && application.date != undefined) {
            let loc_array = address.split("/");
            let filename = loc_array[(loc_array.length - 1)];
            let dir = $scope.downloadFolder + application.date;
            dir += (os.platform() == 'win32') ? '\\' : '/';
            let loc = dir + filename;
            if (!fs.existsSync($scope.downloadFolder)) {
                fs.mkdirSync($scope.downloadFolder);
            }
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            if (!fs.existsSync(loc)) {
                if (download_queue[loc] == undefined) {
                    download_queue[loc] = true;
                    download(server + address, loc, function () {
                        console.log("downloaded " + address);
                        delete (download_queue[loc]);
                    });
                }
            }
        }
    };

    $scope.openFolder = (appId) => {
        shell.openItem($scope.downloadFolder + appId);
    }

    $scope.isFolderExist = (appId) => {
        return fs.existsSync($scope.downloadFolder + appId);
    }

    $scope.toggleChatNav = (n, title) => {
        $scope.chatNav.title = title;
        $scope.chatNav.idx = n;
        $mdSidenav('chats_nav')
            .toggle();
    };

    $scope.isOpenChatNav = function () {
        return $mdSidenav('chats_nav').isOpen();
    };

    $scope.closeChatNav = function () {
        $mdSidenav('chats_nav').close()
            .then(function () {
                //
            });
    };

    $scope.move_tab = (k) => {
        let n = 0;
        for (const key in $scope.tabs) {
            if (key == k) {
                $scope.selectedTab = n;
            } else {
                n++;
            }
        }
    };

    $scope.removeTab = (tab) => {
        delete ($scope.tabs[tab]);
    }

    $scope.now = () => { return Date.now(); }

    $scope.calculate_if_online = (last_seen) => {
        let gap = Date.now() - last_seen;
        return (gap <= online_laps + 10) ? true : false;
    };

    fire.db.staffs.get($scope.user.id, (res) => {
        function iam_online() {
            setInterval(() => {
                fire.db.staffs.update($scope.user.id, { "last_seen": Date.now() });
            }, online_laps);
        }
        if (res == undefined) {
            $scope.user.last_seen = Date.now();
            fire.db.staffs.set($scope.user.id, $scope.user);
            iam_online();
        } else {
            fire.db.staffs.update($scope.user.id, { "last_seen": Date.now() });
            iam_online();
        }
    });

    function gotoBottom(id) {
        setTimeout(() => {
            var element = document.getElementById(id);
            element.scrollTop = element.scrollHeight - 300;
        }, 1500);
    }

    async function check_if_online() {
        $scope.is_online = await isOnline();
        $scope.$apply();
    }
    check_if_online();
    setInterval(check_if_online, 3000);

    //staffs
    fire.db.staffs.when_all((list) => {
        $scope.staff_list = list;
    });

    //chats
    fire.db.chats.query.where("member", "array-contains", "" + $scope.user.id)
        .onSnapshot(function (querySnapshot) {
            var forGroupChat = {};
            querySnapshot.forEach(function (doc) {
                let x = doc.data();
                if (x.type == "personal") {
                    x.member.splice(x.member.indexOf(`${$scope.user.id}`), 1);
                    $scope.my_chats.personal[x.member[0]] = { id: doc.id, data: x };

                    if (x.tread.length > 0) {
                        let n = x.tread[x.tread.length - 1];
                        if (initials[`chat_${doc.id}`]) {
                            // if(!notifChatRecord[n.date])$scope.notify_me(n.staff,n.message);
                        }
                        notifChatRecord[n.date] = true;
                    }
                    initials[`chat_${doc.id}`] = true;
                    if ($scope.tabs.personal_chat != undefined) {
                        if ($scope.tabs.personal_chat.doc_id == doc.id) {
                            $scope.tabs.personal_chat.tread = x.tread;
                            $scope.move_tab('personal_chat');
                            gotoBottom('spc_message_box');
                        }
                    }
                } else if (x.type == 'group') {
                    forGroupChat[doc.id] = x;
                }
            });
            $scope.group_chat_list = forGroupChat;
            $scope.$apply();
        });

    //client chats 
    fire.db.chats.query.where('type', '==', 'public').limit(200).onSnapshot(qs => {
        let clientChats = [];
        let pendingChats = 0;
        qs.forEach(doc => {
            const d = doc.data();
            d.id = doc.id;
            clientChats.push(d);
            pendingChats += d.count;
            if ($scope.tabs.client_chat !== undefined) {
                if ($scope.tabs.client_chat.id === doc.id)
                    $scope.open_client_chat(d);
            }
        });
        $scope.client_chat_list = clientChats;
        $scope.client_chat_count = pendingChats;
    });

    $scope.create_group_chat = (data) => {
        fire.db.chats.query.add(data);
        $scope.toast(`New Group Chat ${data.name} where created.`)
        $scope.close_dialog();
    };

    $scope.open_application_tab = (x) => {
        $scope.tabs.application = { title: 'Transaction No.', application: x };
        applicationListener = null;
        applicationListener = fire.db.transactions.when(x.id, (d) => {
            if ($scope.tabs.application != undefined) {
                $scope.tabs.application.application = d;
            }
        });
        $scope.move_tab('application');
    }

    $scope.open_receipt_tab = (msg, date) => {
        let stamp = (date == undefined) ? Date.now() : date;
        $scope.tabs.receipt = { title: 'Action', message: msg, date: stamp };
        $scope.move_tab('receipt');
    }

    $scope.open_personal_chat = (staff) => {
        function executeOpen() {
            $scope.tabs.personal_chat = {
                title: staff.data.first_name + ' ' + staff.data.last_name, staff: staff,
                tread: $scope.my_chats.personal[staff.id].data.tread,
                doc_id: $scope.my_chats.personal[staff.id].id
            };
            $scope.move_tab('personal_chat');
            gotoBottom('spc_message_box');
            $scope.closeChatNav();
        };
        if ($scope.my_chats.personal[staff.id] != undefined) {
            executeOpen();
        } else {
            //create chat room
            fire.db.chats.query.add({
                "member": [`${$scope.user.id}`, `${staff.id}`],
                "type": "personal",
                "tread": []
            }).then(ref => {
                console.log("added");
                $scope.my_chats.personal[staff.id] = { id: ref.id, data: { tread: [] } };
                executeOpen()
            });
        }
    };

    $scope.open_client_chat = (user) => {
        function openclienttab() {
            $scope.tabs.client_chat = {
                title: user.name, id: user.id,
                count: user.count
            };
            $scope.move_tab('client_chat');
            gotoBottom('cc_message_box');
            $scope.closeChatNav();
        }
        fire.db.chats.query.doc(user.id).collection('treads').limit(500).orderBy('date').onSnapshot(qs => {
            let chats = []
            qs.forEach(doc => {
                let d = doc.data();
                d.id = doc.id;
                chats.push(d);
            });
            openclienttab();
            $scope.tabs.client_chat.tread = chats;
        });
        openclienttab();
    };

    $scope.open_group_chat = (group, docId) => {
        function opengrouptab() {
            $scope.tabs.group_chat = {
                title: group.name, members: group.member,
                doc_id: docId
            };
            $scope.move_tab('group_chat');
            gotoBottom('group_message_box');
            $scope.closeChatNav();
        }
        fire.db.chats.query.doc(docId).collection('treads').limit(500).orderBy('date').onSnapshot(qs => {
            let chats = []
            qs.forEach(doc => {
                let d = doc.data();
                d.id = doc.id;
                chats.push(d);
            });
            opengrouptab();
            // notifChatRecord['group_'+n.date] =true;
            // initials[`groupchat_${docId}`] = true;
            $scope.tabs.group_chat.tread = chats;
        });
        opengrouptab();
    };

    //load json data
    $http.get("./json/permitting/templates.json").then(function (data) {
        $scope.application_templates = data.data.data;
    });

    $scope.load_db = (status) => {
        let s = `${status}`;
        fire.db.transactions.query.where("status", "==", s)
            .onSnapshot(function (querySnapshot) {
                var d = [];
                querySnapshot.forEach(function (doc) {
                    let z = doc.data();
                    console.log(doc.id);
                    d.push(z);
                    if (initials[`transaction_${doc.id}`]) {
                        let t = `${$scope.getTransactionStatus(z.status)}, Transaction`;
                        let m = `Transaction Number : ${z.date}`;
                        // $scope.notify_me(t,m);
                    }
                    initials[`transaction_${doc.id}`] = true;
                    for (const key in $scope.tabs) {
                        if ($scope.tabs.hasOwnProperty(key) && key == 'application') {
                            if ($scope.tabs[key].application.id == z.id) {
                                $scope.tabs[key].application = z;
                            }
                        }
                    }
                });
                $scope.application_list = d;
                $scope.$apply();
            });
    }

    $scope.remove_spc = (docId, message) => {
        fire.db.chats.query.doc(docId).update({ "tread": firebase.firestore.FieldValue.arrayRemove(message) });
        let i = 0;
        $scope.tabs.personal_chat.tread.forEach(e => {
            if (e == message) {
                $scope.tabs.personal_chat.tread.splice(i, 1);
            }
            i++;
        });
    };

    $scope.remove_chat_from_group = (groupId, docId, idx) => {
        let u = $scope.user.data.first_name + " " + $scope.user.data.last_name;
        fire.db.chats.query.doc(groupId).collection('treads').doc(docId).update({ "deleted": true, "removed_by": u });
        $scope.tabs.group_chat.tread.splice(idx, 1);
    };

    $scope.remove_chat_from_client = (clientId, docId, idx) => {
        let u = $scope.user.data.first_name + " " + $scope.user.data.last_name;
        fire.db.chats.query.doc(clientId).collection('treads').doc(docId).update({ "deleted": true, "removed_by": u });
        $scope.tabs.client_chat.tread.splice(idx, 1);
    };

    $scope.load_pending = () => {
        fire.db.transactions.query.where("level", "==", `${$scope.user.user_level}`)
            .onSnapshot(function (querySnapshot) {
                delete ($scope.tabs.pending);
                var d = [];
                querySnapshot.forEach(function (doc) {
                    d.push(doc.data());
                });
                $scope.pending_list = d;
                $scope.$apply();
            });
    }

    $scope.add_tread = function (app_id, data) {
        let t = {
            staff: $scope.user.data.first_name + " " + $scope.user.data.last_name,
            message: data,
            date: Date.now()
        };
        fire.db.transactions.update(`${app_id}`, { "actions": firebase.firestore.FieldValue.arrayUnion(t) });
        delete ($scope.add_tread_message[`${app_id}`]);
    };

    $scope.pc_tread = (staff_id, message) => {
        if ($scope.tabs.personal_chat.doc_id !== undefined) {
            let m = { message: message, date: Date.now(), staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name };
            fire.db.chats.query.doc($scope.tabs.personal_chat.doc_id).update({ "tread": firebase.firestore.FieldValue.arrayUnion(m) });
            delete ($scope.pc_tread_message[`${staff_id}`]);
        }
    }

    $scope.group_tread = (message) => {
        if ($scope.tabs.group_chat.doc_id !== undefined) {
            let m = { message: message, date: Date.now(), staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name };
            fire.db.chats.query.doc($scope.tabs.group_chat.doc_id).collection('treads').add(m);
        }
    }

    $scope.client_tread = (message) => {
        if ($scope.tabs.client_chat.id !== undefined) {
            let m = { message: message, date: Date.now(), user: $scope.user.data.first_name + ' ' + $scope.user.data.last_name };
            fire.db.chats.query.doc($scope.tabs.client_chat.id).collection('treads').add(m).then(() => {
                fire.db.chats.query.doc($scope.tabs.client_chat.id).update({ "count": 0, "received": 1 });
            });
        }
    }

    $scope.upload_attachments = (files, app_id, tab) => {
        var upload_file = (idx) => {
            $scope.uploading_file = true;
            let f = files[idx];
            var form = $utils.upload((data, code) => {
                $scope.uploading_file = false;
                if (code == 200) {
                    if (files.length == (idx + 1)) {
                        let m = `<a href="${api_address}/${data.data}" target="blank" download>${f.name}</a>`;
                        if (tab == 'chat') {
                            if ($scope.pc_tread_message[`${app_id}`] == undefined) $scope.pc_tread_message[`${app_id}`] = "";
                            $scope.pc_tread_message[`${app_id}`] += m + "<br>\n";
                        } else if (tab == 'group') {
                            if ($scope.group_tread_message[`${app_id}`] == undefined) $scope.group_tread_message[`${app_id}`] = "";
                            $scope.group_tread_message[`${app_id}`] += m + "<br>\n";
                        } else if (tab == 'client') {
                            if ($scope.cc_tread_message[`${app_id}`] == undefined) $scope.cc_tread_message[`${app_id}`] = "";
                            $scope.cc_tread_message[`${app_id}`] += m + "<br>\n";
                        } else {
                            if ($scope.add_tread_message[`${app_id}`] == undefined) $scope.add_tread_message[`${app_id}`] = "";
                            $scope.add_tread_message[`${app_id}`] += m + "<br>\n";
                        }
                    } else {
                        upload_file(idx + 1);
                    }
                }
            });
            form.append('action', 'user/upload_file');
            form.append('file', fs.createReadStream(f.path), { filename: f.name });
            form.append('user_id', $scope.user.id);
        };
        if (files.length > 0) upload_file(0);
    };

    // function notify_applicant(applicant_id,application_id,message){
    //     let notif = {
    //         "type" : "applicant",
    //         "user" : applicant_id,
    //         "transaction_id" : application_id,
    //         "message" : message,
    //         "status" : "0",
    //         "date" : Date.now()
    //     };
    //     fire.db.notifications.query.add(notif);
    // }

    // function clear_application_tabs(){
    //     delete($scope.tabs.application);
    // }

    $scope.receive_single = (application) => {
        trigerLoading();
        fire.call('receive_transaction')({
            doc_id: application.id,
            doc_date: application.date,
            staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            staff_id: $scope.me.doc_id,
            applicant_id: application.user.id,
            applicant_name: application.data.application.applicant
        }).then(res => {
            $scope.is_loading = false;
            $scope.toast(res.data);
            $scope.open_receipt_tab(res.data);
        });
        delete ($scope.tabs.application);

        // fire.db.transactions.update(application.id,{
        //     "level":"5",
        //     "status":"1",
        //     "data.received" : {
        //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
        //         "date" : $scope.date_now(),
        //         "staff_id" : $scope.user.id
        //     }
        // });
        // notify_applicant(application.user.id,application.id,
        //     "Your application is received and accepted for processing. Staff : " 
        //     + $scope.user.data.first_name + ' ' 
        //     + $scope.user.data.last_name);
        // delete($scope.tabs.application);

        // let act = `You received application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box to process application. Thank you.`;
        // $scope.toast(act);
        // $scope.open_receipt_tab(act);
        // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        // setTimeout(()=>{
        //     $scope.toast("See your pending box to process application.");
        // },3000)
    }

    $scope.rejectApplication = (application, ev) => {
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

        $mdDialog.show(confirm).then(function (result) {
            trigerLoading();
            fire.call('reject_transaction')({
                doc_id: application.id,
                doc_date: application.date,
                staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                reject_reason: result,
                staff_id: $scope.me.doc_id,
                applicant_id: application.user.id,
                applicant_name: application.data.application.applicant
            }).then(res => {
                $scope.is_loading = false;
                $scope.toast(res.data);
                $scope.open_receipt_tab(res.data);
            });
            delete ($scope.tabs.application);

            // fire.db.transactions.update(application.id,{
            //     "level":"-1",
            //     "status":"2",
            //     "data.rejected" : {
            //         "message" : result,
            //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            //         "date" : $scope.date_now(),
            //         "staff_id" : $scope.user.id
            //     }
            // });
            // notify_applicant(application.user.id,application.id,"Sorry, we are unable to process your application. Please re-submit. Reason: " + result);
            // clear_application_tabs();

            // let act = `You reject application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}.`;
            // $scope.toast(act);
            // $scope.open_receipt_tab(act);
            // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        }, function () {
            // cancel
        });
    }

    $scope.acceptApplication = (application, ev, extra) => {
        let u = {};
        if (extra !== undefined) u = extra;
        // u["level"] = "7";
        // if(application.data.accepted == undefined){
        //     u["status"] = "3";
        //     u["data.accepted"] = {
        //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
        //         "date" : $scope.date_now(),
        //         "staff_id" : $scope.user.id
        //     };
        // }
        trigerLoading();
        fire.call('process_transaction')({
            doc_id: application.id,
            doc_date: application.date,
            staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            process_info: u,
            returned: (application.data.accepted == undefined) ? true : false,
            staff_id: $scope.me.doc_id,
            applicant_id: application.user.id,
            applicant_name: application.data.application.applicant
        }).then(res => {
            $scope.is_loading = false;
            $scope.toast(res.data);
            $scope.open_receipt_tab(res.data);
        });
        delete ($scope.tabs.application);

        // fire.db.transactions.update(application.id,u);
        // notify_applicant(application.user.id,application.id,"Your application is undergoing review.");
        // clear_application_tabs();
        // console.log(application)
        // let act = `You processed application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
        // $scope.toast(act);
        // $scope.open_receipt_tab(act);
        // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
    }

    $scope.approveApplication = (application, ev, extra) => {
        let u = {};
        if (extra !== undefined) u = extra;
        trigerLoading();
        fire.call('review_transaction')({
            doc_id: application.id,
            doc_date: application.date,
            staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            process_info: u,
            returned: (application.data.approved == undefined) ? true : false,
            staff_id: $scope.me.doc_id,
            applicant_id: application.user.id,
            applicant_name: application.data.application.applicant
        }).then(res => {
            $scope.is_loading = false;
            $scope.toast(res.data);
            $scope.open_receipt_tab(res.data);
        });
        delete ($scope.tabs.application);

        // u["level"] = "8";
        // if(application.data.approved == undefined){
        //     u["status"] = "4";
        //     u["data.approved"] = {
        //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
        //         "date" : $scope.date_now(),
        //         "staff_id" : $scope.user.id
        //     };
        // }

        // fire.db.transactions.update(application.id,u);
        // notify_applicant(application.user.id,application.id,"Your application has been reviewed.");
        // clear_application_tabs();

        // let act = `You reviewed application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
        // $scope.toast(act);
        // $scope.open_receipt_tab(act);
        // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
    }

    $scope.recommendApplication = (application, ev, extra) => {
        let u = {};
        if (extra !== undefined) u = extra;
        trigerLoading();
        fire.call('recommend_transaction')({
            doc_id: application.id,
            doc_date: application.date,
            staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            process_info: u,
            returned: (application.data.recommended == undefined) ? true : false,
            staff_id: $scope.me.doc_id,
            applicant_id: application.user.id,
            applicant_name: application.data.application.applicant
        }).then(res => {
            $scope.is_loading = false;
            $scope.toast(res.data);
            $scope.open_receipt_tab(res.data);
        });
        delete ($scope.tabs.application);

        // u["level"] = "4";
        // if(application.data.recommended == undefined){
        //     u["status"] = "5";
        //     u["data.recommended"] = {
        //         "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
        //         "date" : $scope.date_now(),
        //         "staff_id" : $scope.user.id
        //     };
        // }
        // let act = `You recommend application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
        // $scope.toast(act);
        // $scope.open_receipt_tab(act);
        // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        // fire.db.transactions.update(application.id,u);
        // notify_applicant(application.user.id,application.id,"Your application has been recommended for approval.");
        // clear_application_tabs();
    }

    $scope.acknowledgeApplication = (application, ev, extra) => {
        var confirm = $mdDialog.prompt()
            .title('Confirm Permit')
            .textContent(`Confirmation Code was sent to your mobile number. Please confirm the approval of the application number ${application.date}`)
            .placeholder('code')
            .ariaLabel('code')
            .initialValue('')
            .targetEvent(ev)
            .required(true)
            .ok('Confirm')
            .cancel('Close');

        $mdDialog.show(confirm).then(function (result) {
            let u = {};
            if (extra !== undefined) u = extra;
            // u["level"] = "-1";
            // u["status"] = "6";
            // u["data.acknowledged"] = {
            //     "staff" : $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
            //     "date" : $scope.date_now(),
            //     "staff_id" : $scope.user.id
            // };

            //expiration
            // if(application.name == "Application for Local Transport Permit RFF"){
            //     u["expiration"] = $scope.to_date(Date.now() + tm);
            // }else {
            //     u["expiration"] = $scope.to_date(Date.now() + ty);
            // }
            trigerLoading();
            fire.call('approve_transaction')({
                doc_id: application.id,
                doc_date: application.date,
                staff: $scope.user.data.first_name + ' ' + $scope.user.data.last_name,
                process_info: u,
                staff_id: $scope.me.doc_id,
                application_name: application.name,
                applicant_id: application.user.id,
                applicant_name: application.data.application.applicant
            }).then(res => {
                $scope.is_loading = false;
                $scope.toast(res.data);
                $scope.open_receipt_tab(res.data);
            });
            delete ($scope.tabs.application);

            // fire.db.transactions.update(application.id,u);
            // notify_applicant(application.user.id,application.id,"Thank you very much! Your application is approved.");
            // clear_application_tabs();

            // let act = `You approved application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
            // $scope.toast(act);
            // $scope.open_receipt_tab(act);
            // fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({name:"action",message:act,date:Date.now()});
        }, function () {
            // cancel
        });

    }

    $scope.returnApplication = (application, ev, lvl, stats) => {
        fire.db.transactions.update(application.id, { "level": `${lvl}`, "status": `${stats}` });
        let act = `You return application number ${application.date} of ${application.data.application.applicant} on ${$scope.to_date(application.date)}. See your pending box for updates. Thank you.`;
        $scope.toast(act);
        $scope.open_receipt_tab(act);
        fire.db.staffs.query.doc($scope.me.doc_id).collection("logs").add({ name: "action", message: act, date: Date.now() });
        clear_application_tabs();
    }

});
'use strict';

myAppModule.controller('document_management_controller', function ($scope, $timeout, $utils, $mdDialog, $interval) {
    var INCOMING_DB = new JsonDB("./DB/INCOMING_DOCUMENTS", true, false);
    const documents_string = "/documents";
    const categ_string = "/categories";
    const assignee_string = "/assignee";
    const online_server_folder = "https://pcsd.gov.ph/igov/wp-admin/";

    try {
        INCOMING_DB.getData(documents_string + "[0]");
    } catch (error) {
        INCOMING_DB.push(documents_string, []);
    };

    $scope.user = $scope.user || {};
    $scope.image_download_queue = [];
    $scope.attachment_download_queue = [];
    $scope.categ = [];
    $scope.user.wp_id = 32;
    $scope.update_queue = 0;

    $scope.PrintImage = (source) => {
        let x = {
            img_url: source,
            view: "app/pages/document_management/single/image.html"
        };
        window.open('index.html?' + $.param(x), 'modal');
    };

    $scope.categories = (v) => {
        v = (v == undefined) ? 0 : v;
        let c = [];
        INCOMING_DB.getData(categ_string).forEach(element => {
            if (element.documents > v) {
                c.push({ id: element.id, title: element.value });
            }
        });
        return c;
    }

    $scope.document = (v) => {
        return INCOMING_DB.getData(documents_string).filter(d => d.id == v)[0];
    }

    $scope.update_single_doc = (x) => {
        if ($scope.update_queue == 0) {
            $scope.update_queue = 1;
            let q = {
                data: {
                    action: "document_management/document/get",
                    doc_id: x.id
                },
                callBack: function (data) {
                    $scope.update_queue = 0;
                    if (data.data.status == 1) {
                        var index = 0;
                        INCOMING_DB.getData(documents_string).forEach(element => {
                            if (element.id == x.id) {
                                INCOMING_DB.push(documents_string + "[" + index + "]", data.data.data);
                                x = data.data.data;
                                return;
                            } else {
                                index++;
                            }
                        });
                    }
                }
            };
            $utils.api(q);
        }
    }

    $scope.wp_user = (v) => {
        let c = {};
        INCOMING_DB.getData(assignee_string).forEach(element => {
            if (element.wp_id == v)
                c = element;
        });
        return c;
    }

    $scope.assignee = (v) => {
        let c = {};
        INCOMING_DB.getData(assignee_string).forEach(element => {
            if (element.id == v) {
                c = element;
                return c;
            }
        });
        return c;
    }

    $scope.has_user = (meta) => {
        let s = meta.value.split(",");
        return (s.length > 1) ? true : false;
    }

    $scope.get_assignee_from_action = (meta) => {
        let s = meta.value.split(",");
        return (s.length > 1) ? $scope.assignee(s[1]) : null;
    }

    $scope.get_receipient_from_action = (meta) => {
        let s = meta.value.split(",");
        return (s.length > 2) ? $scope.assignee(s[2]) : null;
    }

    $scope.open_document = (d) => {
        let x = { doc_id: d.id, view: "app/pages/document_management/single/document.html" };
        window.open('index.html?' + $.param(x), 'modal');
        // ipcRenderer.send('open_child_window','index.html?'+ $.param(x));
    };


    $scope.load_categories = () => {
        let q = {
            data: {
                action: "document_management/categories/get"
            },
            callBack: function (data) {
                if (data.data.status == 1) {
                    INCOMING_DB.push(categ_string, data.data.data);
                    $scope.categ = $scope.categories(0);
                }
            }
        };
        $utils.api(q);
    };

    $scope.load_assignee = () => {
        let q = {
            data: {
                action: "document_management/assignee/get"
            },
            callBack: function (data) {
                if (data.data.status == 1) {
                    INCOMING_DB.push(assignee_string, data.data.data);
                }
            }
        };
        $utils.api(q);
    };

    $scope.load_documents = () => {
        $scope.load_categories();
        $scope.load_assignee();
        let q = {
            data: {
                action: "document_management/document/count"
            },
            callBack: function (data) {
                if (data.data.status == 1) {
                    $scope.max_docs = data.data.data;
                    $timeout($scope.get_documents, 50);
                }
            }
        };
        $utils.api(q);
    };

    $scope.invalidate_table = () => {
        let xx = INCOMING_DB.getData(documents_string);
        let d = [];
        for (let i = (xx.length - 1); i != 0; i--) {
            d.push(xx[i]);
        }
        $scope.tbl_documents = $scope.ngTable(d);
        $scope.categ = $scope.categories();
    };

    $scope.get_documents = () => {
        var d = INCOMING_DB.getData(documents_string);
        var l = (d.length > 0) ? d[d.length - 1].id : 0;
        var current_length = d.length;
        let q = {
            data: {
                action: "document_management/document/load",
                offset: current_length,
                last_id: l
            },
            callBack: function (data) {
                if (data.data.status == 1) {
                    INCOMING_DB.push(documents_string, data.data.data, false);
                    $scope.loading_value = ((current_length + data.data.data.length) / $scope.max_docs) * 100;
                    $timeout($scope.get_documents, 50);
                } else {
                    $timeout($scope.invalidate_table, 50);
                    $scope.is_loading = false;
                }
            },
            errorCallBack: () => {
                $timeout($scope.invalidate_table, 50);
                $scope.is_loading = false;
            }
        };
        $utils.api(q);
    };

    $scope.is_downloading_image = (id) => {
        return ($scope.image_download_queue[id] == true) ? true : false;
    }

    $scope.is_downloading_attachment = (id) => {
        return ($scope.attachment_download_queue[id] == true) ? true : false;
    }

    $scope.download_single_image = function (img) {
        let loc = './downloads/' + img.address;
        let loc_array = loc.split("/");

        for (let i = 0; i < (loc_array.length - 1); i++) {
            let folder = "";
            for (let v = 0; v < (i + 1); v++) {
                folder += loc_array[v] + "/";
            }
            let dir = "./" + folder;
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir);
        }

        $scope.image_download_queue[img.id] = true;
        download(online_server_folder + img.address, loc, function () {
            delete $scope.image_download_queue[img.id];
            $scope.$apply();
        });
    };

    $scope.download_single_attachment = (f) => {
        let loc = app.getPath('downloads') + f.address;
        let loc_array = loc.split("/");

        for (let i = 0; i < (loc_array.length - 1); i++) {
            let folder = "";
            for (let v = 0; v < (i + 1); v++) {
                folder += loc_array[v] + "/";
            }
            let dir = folder;
            if (!fs.existsSync(dir))
                fs.mkdirSync(dir);
        }

        $scope.attachment_download_queue[f.id] = true;
        download(online_server_folder + f.address, loc, function () {
            delete $scope.attachment_download_queue[f.id];
            $scope.$apply();
        });
    };

    $scope.reload_all_data = () => {
        INCOMING_DB.push(documents_string, []);
        $scope.is_loading = true;
        $scope.loading_value = 0
        $scope.load_documents();
    }

});

'use strict';

document.write(`<script src="./plugins/chartjs/Chart.min.js"></script>`);
var graphOption = {
    responsive: true,
    title: {
        display: true,
        text: ''
    },
    tooltips: {
        mode: 'index',
        intersect: false,
    },
    hover: {
        mode: 'nearest',
        intersect: true
    },
    scales: {
        xAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Year'
            }
        }],
        yAxes: [{
            display: true,
            scaleLabel: {
                display: true,
                labelString: 'Count'
            }
        }]
    }
};
myAppModule.controller('pcsd_database_controller', function ($scope,
    $timeout, $utils, $mdToast, $localStorage) {
    var XLSX = require('xlsx');
    $scope.wsup_db = { data: [], summary: {} };
    $scope.wsup_db.data = ($localStorage.wsup_db_data) ? $localStorage.wsup_db_data : [];
    $scope.wsup_db.summary = ($localStorage.wsup_db_summary) ? $localStorage.wsup_db_summary : {};
    $scope.database_view = './app/pages/database/views/graphs.html';
    $scope.currentNavItem = 'Statistics';
    $scope.dropDownSelect = {};
    $scope.selectItems = {};
    $scope.n = {};

    //WSUP
    fire.db.database.query.doc('WSUP').collection("database").onSnapshot(qs => {
        let res = qs.docs.map(dx => {
            let b = dx.data();
            b.id = dx.id;
            return b;
        });
        $scope.wsup_db.data = $localStorage.wsup_db_data = res;
        $scope.invalidate_data_table($scope.wsup_db.data);
    });
    fire.db.database.when("WSUP", (d) => {
        $scope.wsup_db.summary = $localStorage.wsup_db_summary = d;
        setTimeout($scope.loadGraph, 100);
    });

    $scope.invalidate_data_table = (d) => {
        $scope.data_table = $scope.ngTable(d);
    };

    $scope.getKeys = (data, key) => {
        let f = {};
        data.map(d => {
            if (d[key]) f[d[key]] = true;
            return d[key];
        });
        let r = [];
        let c = [];
        for (const key in f) {
            r.push({ id: key, title: key });
            c.push(key);
        }
        $scope.selectItems[key] = c;
        $scope.dropDownSelect[key] = r;
    };

    $scope.changeView = (v) => { $scope.database_view = v; };

    $scope.loadGraph = () => {
        let labels = [];
        let datas = [];
        if ($scope.wsup_db.summary) {
            //Yearly Count
            if ($scope.wsup_db.summary.count) {
                for (const key in $scope.wsup_db.summary.count) {
                    if ($scope.wsup_db.summary.count.hasOwnProperty(key)) {
                        const e = $scope.wsup_db.summary.count[key];
                        if (key != 'all') {
                            labels.push(key);
                            datas.push(e.total);
                        }
                    }
                }
                graphOption.title.text = 'Yearly Permit Status';
                var graph_config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'WSUP',
                            fill: false,
                            backgroundColor: '#f67019',
                            borderColor: '#f67019',
                            data: datas,
                        }]
                    },
                    options: graphOption
                };
                new Chart(document.getElementById('canvas1').getContext('2d'), graph_config);
            }

            //Per Municipality
            if ($scope.wsup_db.summary.per_municipality) {
                labels = [];
                datas = [];
                for (const key in $scope.wsup_db.summary.per_municipality) {
                    if ($scope.wsup_db.summary.per_municipality.hasOwnProperty(key)) {
                        const e = $scope.wsup_db.summary.per_municipality[key];
                        if (e > 50) {
                            labels.push(key);
                            datas.push(e);
                        }
                    }
                }
                graphOption.title.text = 'Total Permit Per Municipality';
                graphOption.scales.xAxes[0].scaleLabel.labelString = 'Municipality/City';
                var graph_config = {
                    type: 'line',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'WSUP',
                            fill: false,
                            backgroundColor: '#f67019',
                            borderColor: '#f67019',
                            data: datas,
                        }]
                    },
                    options: graphOption
                };
                new Chart(document.getElementById('canvas2').getContext('2d'), graph_config);
            }
        } else {
            setTimeout($scope.loadGraph, 3000);
        };
    };

    $scope.openAddWSUPModal = (evt) => {
        $scope.n = {};
        $scope.showPrerenderedDialog(evt, 'addWSUP');
    };

    $scope.addWSUPData = async (e) => {
        $scope.close_dialog();
        let i = {};
        for (const key in e) {
            if (e.hasOwnProperty(key)) {
                const element = (e[key] != undefined) ? e[key] : '';
                i[key] = element;
            }
        }
        i.name = (e.First_Name || '') + " " + (e.Middle_Name || '') + " " + (e.Last_Name || '') + " " + (e.Extension_Name || '');
        i.address = (e.Street || '') + ", " + (e.Barangay || '') + ", " + (e.Municipality || '');
        if (e.Issued_Year && e.Issued_Month && e.Issued_Day) {
            i.Issued_Date = e.Issued_Year + "-" + e.Issued_Month + "-" + e.Issued_Day;
        }
        if (e.Validity_Year && e.Validity_Month && e.Validity_Day) {
            i.Validity_Date = e.Validity_Year + "-" + e.Validity_Month + "-" + e.Validity_Day;
        }
        i.keywords = i.name.split(' ').filter(d => d.length > 1);
        await fire.db.database.query.doc("WSUP").collection("database").add(i);
        let u = {};
        u["count.all"] = firebase.firestore.FieldValue.increment(1);
        if (e.Issued_Year != undefined) u[`count.${e.Issued_Year}.total`] = firebase.firestore.FieldValue.increment(1);
        if (e.Issued_Month != undefined) u[`count.${e.Issued_Year}.${e.Issued_Month}`] = firebase.firestore.FieldValue.increment(1);
        if (e.Municipality != undefined) u[`per_municipality.${e.Municipality}`] = firebase.firestore.FieldValue.increment(1);
        await fire.db.database.query.doc("WSUP").update(u);
        $scope.toast('New WSUP data added!');
    };


    $scope.upload_excel = (files, permitType) => {
        if (uploading_type != '') return;
        if (typeof (files) == typeof ([])) {
            uploading_type = t;
            var file = files[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                var data = new Uint8Array(e.target.result);
                let wb = XLSX.read(data, { type: 'array' });
                wb.SheetNames.forEach(element => {
                    let jsonData = XLSX.utils.sheet_to_json(wb.Sheets[element]);
                });
            };
            reader.readAsArrayBuffer(file);
        } else {
            $scope.toast("file error");
        }

    }

    $scope.save_database = (json, databaseName) => {

        async function createDatabase() {
            await fire.db.database.query.doc("WSUP").set({ "id": "WSUP" });
            //console.log("DB Created");
            json[0].data.forEach(async (e) => {
                let i = {};
                for (const key in e) {
                    if (e.hasOwnProperty(key)) {
                        const element = (e[key] != undefined) ? e[key] : '';
                        i[key] = element;
                    }
                }
                i.name = (e.First_Name || '') + " " + (e.Middle_Name || '') + " " + (e.Last_Name || '') + " " + (e.Extension_Name || '');
                i.address = (e.Street || '') + ", " + (e.Barangay || '') + ", " + (e.Municipality || '');
                if (e.Issued_Year && e.Issued_Month && e.Issued_Day) {
                    i.Issued_Date = e.Issued_Year + "-" + e.Issued_Month + "-" + e.Issued_Day;
                }
                if (e.Validity_Year && e.Validity_Month && e.Validity_Day) {
                    i.Validity_Date = e.Validity_Year + "-" + e.Validity_Month + "-" + e.Validity_Day;
                }
                i.keywords = i.name.split(' ').filter(d => d.length > 1);
                await fire.db.database.query.doc("WSUP").collection("database").add(i);
                let u = {};//statisticss
                u["count.all"] = firebase.firestore.FieldValue.increment(1);
                if (e.Issued_Year != undefined) u[`count.${e.Issued_Year}.total`] = firebase.firestore.FieldValue.increment(1);
                if (e.Issued_Month != undefined) u[`count.${e.Issued_Year}.${e.Issued_Month}`] = firebase.firestore.FieldValue.increment(1);
                if (e.Municipality != undefined) u[`per_municipality.${e.Municipality}`] = firebase.firestore.FieldValue.increment(1);
                await fire.db.database.query.doc("WSUP").update(u);
            });
        };
        createDatabase();


        // let vv = [ 'Corporation ', 'Last_Name'];

        // vv.forEach(v => {
        //     let mun = {};
        //     d[0].data.forEach(e => {
        //         if(e[v] != undefined)
        //             mun[e[v]] = (mun[e[v]] == undefined)? 1 : mun[e[v]] + 1;
        //     });
        //     console.log(mun);
        // });


    }
}).
    controller('ApprehensionController', function ($scope, $crudService, municipalityService) {
        var apprehensionDocument = db.collection('database').doc('Apprehension');
        var apprehensionCollection = apprehensionDocument.collection('apprehensions');
        $scope.apprehensionsTable = $scope.ngTable([]);

        $scope.refreshList = () => {
            $crudService.getItems(apprehensionCollection).then(apprehensions => {
                $scope.apprehensionsTable = $scope.ngTable(apprehensions);
            })
        }

        $scope.refreshList();

        $scope.Months = [
            { id: 1, title: "January", days: 31 },
            { id: 2, title: "February", days: 28 },
            { id: 3, title: "March", days: 31 },
            { id: 4, title: "April", days: 30 },
            { id: 5, title: "May", days: 31 },
            { id: 6, title: "June", days: 30 },
            { id: 7, title: "July", days: 31 },
            { id: 8, title: "August", days: 31 },
            { id: 9, title: "September", days: 30 },
            { id: 10, title: "October", days: 31 },
            { id: 11, title: "November", days: 30 },
            { id: 12, title: "December", days: 31 }
        ];

        $scope.apprehensionFormData = {};
        $scope.saveApprehension = addApprehension;

        $scope.closeAppehensionForm = () => {
            $scope.close_dialog();
        }
        $scope.municipalities = [];
        municipalityService.getMunicipalities().then(municipalities => {
            $scope.municipalities = municipalities;
        });

        $scope.refreshAOBarangays = () => {
            municipalityService.getBarangays($scope.apprehensionFormData.AO_Municipality).then(barangays => {
                $scope.AOBarangays = barangays;
            });
        }
        $scope.refreshPABarangays = () => {
            municipalityService.
                getBarangays($scope.apprehensionFormData.PA_Municipality).
                then(barangays => {
                    $scope.PABarangays = barangays;
                });
        }

        $scope.openApprehensionForm = (event) => {
            $scope.saveApprehension = addApprehension;
            $scope.PABarangays = [];
            $scope.AOBarangays = [];
            $scope.apprehensionFormData = {};
            $scope.showPrerenderedDialog(event, 'apprehensionForm');
        }

        $scope.getApprehension = (id) => {
            $crudService.getItem(id, apprehensionCollection).then(apprehension => {
                $scope.apprehensionFormData = convertToFormData(apprehension);
            });
        }

        $scope.openApprehensionFormForUpdating = (event, apprehensionID) => {
            $scope.saveApprehension = updateApprehension;
            $crudService.getItem(apprehensionID, apprehensionCollection).then(apprehension => {
                $scope.apprehensionFormData = convertToFormData(apprehension);
                $scope.refreshAOBarangays();
                $scope.refreshPABarangays();
                $scope.showPrerenderedDialog(event, 'apprehensionForm');
            });
        }
        function convertToFormData(apprehension) {
            let formData = apprehension;
            formData.Violations = apprehension.Violations.join(',');
            formData.ApprehensionDate = new Date(apprehension.Year, apprehension.Month - 1, apprehension.Day);
            formData.PA_Barangay = apprehension.PA_Barangay.toUpperCase();
            formData.AO_Barangay = apprehension.AO_Barangay.toUpperCase();
            return formData;
        }

        function convertToApprehensionObject(formData) {
            var apprehension = {
                Control_Number: $scope.apprehensionFormData.Control_Number || '',
                Case_ID: $scope.apprehensionFormData.Case_ID || '',
                Violations: $scope.apprehensionFormData.Violations && $scope.apprehensionFormData.Violations.split(',') || '',
                Month: $scope.apprehensionFormData.ApprehensionDate.getMonth() + 1,
                Day: $scope.apprehensionFormData.ApprehensionDate.getDate(),
                Year: $scope.apprehensionFormData.ApprehensionDate.getFullYear(),
                AO_Sitio: $scope.apprehensionFormData.AO_Sitio || '',
                AO_Barangay: $scope.apprehensionFormData.AO_Barangay || '',
                AO_Municipality: $scope.apprehensionFormData.AO_Municipality || '',
                PA_Sitio: $scope.apprehensionFormData.PA_Sitio || '',
                PA_Barangay: $scope.apprehensionFormData.PA_Barangay || '',
                PA_Municipality: $scope.apprehensionFormData.PA_Municipality || '',
                Apprehending_Agency: $scope.apprehensionFormData.Apprehending_Agency || '',
                Remarks: $scope.apprehensionFormData.Remarks || '',
                Keywords: [$scope.apprehensionFormData.Control_Number],
                id: $scope.apprehensionFormData.id || ''
            };
            apprehension.Keywords = apprehension.Keywords.concat(apprehension.Violations);

            return apprehension;
        }

        function addApprehension() {
            var apprehension = convertToApprehensionObject($scope.apprehensionFormData);

            $crudService.addItem(apprehension, apprehensionCollection).then(addOperationResult => {
                $scope.toast("Sucess");
                $scope.close_dialog();
                clearFormData();
                apprehension.Municipality = apprehension.PA_Municipality;
                $crudService.updateCounterFor(apprehension, apprehensionDocument);
            },
                failedOperationResult => {

                });
        }

        function updateApprehension() {
            var apprehension = convertToApprehensionObject($scope.apprehensionFormData);
            $crudService.updateItem(apprehension, apprehensionCollection).then(updateResult => {
                $scope.toast("Sucess");
                $scope.close_dialog();
            });
        }
        function clearFormData() {
            $scope.apprehensionFormData = {};
        }

        $scope.dateNow = new Date();
    }).
    service("municipalityService", function () {
        this.getMunicipalities = () => {
            var palawanMunicipalities = Object.keys(
                require('./json/palawanMunicipalities.json').municipality_list
            );

            return new Promise((resolve, reject) => {
                resolve(palawanMunicipalities);
            })
        }

        this.getBarangays = (municipality) => {
            return new Promise((resolve, reject) => {
                var palawanMunicipalities = require('./json/palawanMunicipalities.json');
                var barangays = palawanMunicipalities["municipality_list"][municipality] ?
                    palawanMunicipalities["municipality_list"][municipality]["barangay_list"] :
                    [];

                resolve(barangays)
            })
        }
    }).
    controller('ChainsawRegistrationController', (
        $scope,
        $crudService,
        municipalityService) => {
        var chainsawDocument = db.collection('database').doc('ChainsawRegistration');
        var chainsawCollection = chainsawDocument.collection('Registerted Chainsaws');

        $scope.registeredChainsawsTable = $scope.ngTable([]);
        $scope.chainsawFormData = {};
        $scope.municipalities = [];
        $scope.barangays = [];
        $scope.dateNow = new Date();
        $scope.chainsaws = [];

        municipalityService.getMunicipalities().then(municipalities => {
            $scope.municipalities = municipalities;
        });

        $scope.refreshList = () => {
            $crudService.getItems(chainsawCollection, convertToChainsawObjectFromSnapshot).
                then(chainsaws => {
                    $scope.chainsaws = chainsaws;
                    $scope.registeredChainsawsTable = $scope.ngTable(chainsaws);
                },
                    error => {
                        $scope.toast("Oooops something went wrong. Please try again.");
                        console.log(error);
                    })
        }

        $scope.refreshList();

        function addChainsaw() {
            let chainsaw = convertToChainsawObject($scope.chainsawFormData);
            $crudService.addItem(chainsaw, chainsawCollection).then(chainsaw => {
                $scope.toast("Succes");
                $scope.close_dialog();
                $scope.chainsaws.push(chainsaw);
                refreshRegisteredChainsawsTable();
                $scope.chainsawFormData = {};
            },
                error => {
                    $scope.toast("Oooops something went wrong. Please try again.");
                    console.log(error);
                });
        }

        function refreshRegisteredChainsawsTable() {
            $scope.registeredChainsawsTable = $scope.ngTable($scope.chainsaws);
        }

        function updateChainsaw() {
            let updatedChainsaw = convertToChainsawObject($scope.chainsawFormData)
            $crudService.updateItem(updatedChainsaw, chainsawCollection).then(result => {
                $scope.toast('Success');
                $scope.close_dialog();
                let index = $scope.chainsaws.findIndex(chainsaw => chainsaw.id == updatedChainsaw.id);
                $scope.chainsaws[index] = updatedChainsaw;
                refreshRegisteredChainsawsTable();
                $scope.chainsawFormData = {};
            },
                error => {
                    $scope.toast('Ooooops something went wrong.');
                    console.log(error);
                });
        }

        $scope.openRegistrationForm = (event) => {
            $scope.saveChainsaw = addChainsaw;
            $scope.chainsawFormData = {};
            $scope.barangays = [];
            $scope.showPrerenderedDialog(event, 'chainsawRegistrationForm');
        }

        $scope.openRegistrationFormForUpdating = (id) => {
            $scope.saveChainsaw = updateChainsaw;
            $crudService.
                getItem(id, chainsawCollection, convertToChainsawObjectFromSnapshot).
                then(chainsaw => {
                    $scope.chainsawFormData = chainsaw;
                    $scope.refreshBarangays();
                    $scope.showPrerenderedDialog(event, 'chainsawRegistrationForm');
                },
                    error => {
                        $scope.toast('Ooooops something went wrong.');
                        console.log(error);
                    })
        }

        $scope.closeRegistrationForm = () => {
            $scope.close_dialog();
        }

        $scope.refreshBarangays = () => {
            municipalityService.getBarangays($scope.chainsawFormData.Owner.Municipality).then(barangays => {
                $scope.barangays = barangays;
            })
        }


        function convertToChainsawObject(formData) {
            let chainsaw = {
                CORNumber: formData.CORNumber || '',
                Agency: formData.Agency || '',
                Owner: {
                    FirstName: formData.Owner && formData.Owner.FirstName || '',
                    MiddleInitial: formData.Owner && formData.Owner.MiddleInitial || '',
                    LastName: formData.Owner && formData.Owner.LastName || '',
                    NameExtension: formData.Owner && formData.Owner.NameExtension || '',
                    Barangay: formData.Owner && formData.Owner.Barangay || '',
                    Street: formData.Owner && formData.Owner.Street || '',
                    Municipality: formData.Owner && formData.Owner.Municipality || ''
                },
                MetalSealNumber: formData.MetalSealNumber || '',
                SerialNumber: formData.SerialNumber || '',
                RegistrationDate: formData.RegistrationDate || '',
                ExpirationDate: formData.ExpirationDate || '',
                LimitationOfUse: formData.LimitationOfUse || '',
                Remarks: formData.Remarks || '',
                Keywords: [],
                id: formData.id || ''
            };
            chainsaw.Keywords = [
                chainsaw.Owner.LastName,
                chainsaw.Owner.MiddleInitial,
                chainsaw.Owner.FirstName,
                chainsaw.CORNumber
            ].filter(value => value.length > 0);
            return chainsaw;
        }

        function convertToChainsawObjectFromSnapshot(snapshot) {
            let chainsaw = snapshot.data();
            chainsaw.id = snapshot.id;
            chainsaw.RegistrationDate = chainsaw.RegistrationDate ? new Date(chainsaw.RegistrationDate.seconds * 1000) : '';
            chainsaw.ExpirationDate = chainsaw.ExpirationDate ? new Date(chainsaw.ExpirationDate.seconds * 1000) : '';

            if (chainsaw.Owner && chainsaw.Owner.Barangay)
                chainsaw.Owner.Barangay = chainsaw.Owner.Barangay.toUpperCase();

            return chainsaw;
        }

    }).
    controller('PermitController', function ($crudService, municipalityService, $scope) {
        var chainsawDocument;
        var purchasePermitCollection;

        $scope.setDocumentName = (documentName) => {
            chainsawDocument = db.collection('database').doc(documentName);
            purchasePermitCollection = chainsawDocument.collection('permits');
        }

        $scope.permits = [];
        $scope.permitsTable = $scope.ngTable([]);
        $scope.chainsawPermitFormData = {};
        $scope.municipalities = [];
        $scope.barangays = [];
        $scope.dateNow = new Date();

        municipalityService.getMunicipalities().then(municipalities => {
            $scope.municipalities = municipalities;
        });

        $scope.refreshList = () => {
            $crudService.getItems(purchasePermitCollection, converFromSnapshotToPermitObject).then(permits => {
                $scope.permits = permits;
                $scope.permitsTable = $scope.ngTable($scope.permits);
            })
        }

        let addPermit = () => {
            let permit = convertFromFormDataToPermitObject($scope.chainsawPermitFormData);
            $crudService.addItem(permit, purchasePermitCollection).then(permit => {
                $scope.toast("Success");
                $scope.close_dialog();
                $scope.permits.push(permit);
                $crudService.updateCounterFor(permit, chainsawDocument);
            },
                error => {
                    console.log(error);
                    $scope.toast("Oooops something went wrong. Please try again.");
                })
        }

        let updatePermit = () => {
            let updatedPermit = convertFromFormDataToPermitObject($scope.chainsawPermitFormData);
            $crudService.updateItem(updatedPermit, purchasePermitCollection).then(result => {
                $scope.toast("Success");
                $scope.close_dialog();
                let index = $scope.permits.findIndex(permit => permit.id == updatedPermit.id);
                $scope.permits[index] = updatePermit;
                $scope.permitsTable = $scope.ngTable($scope.permits);
            },
                error => {
                    $scope.toast("Oooops something went wrong. Please try again.");
                });
        }

        $scope.refreshBarangays = () => {
            municipalityService.getBarangays($scope.chainsawPermitFormData.Municipality).then(barangays => {
                $scope.barangays = barangays;
            })
        }

        $scope.openPermitForm = (event, formName) => {
            $scope.chainsawPermitFormData = {};
            $scope.savePermit = addPermit;
            $scope.barangays = [];
            $scope.showPrerenderedDialog(event, formName);
        }

        $scope.openPermitFormForUpdating = (event, formName, permitToUpate) => {
            $crudService.getItem(permitToUpate.id, purchasePermitCollection, converFromSnapshotToPermitObject).
                then(permit => {
                    $scope.chainsawPermitFormData = permit;
                    $scope.refreshBarangays();
                    $scope.savePermit = updatePermit;
                    $scope.showPrerenderedDialog(event, formName);
                })
        }

        $scope.closeRegistrationForm = () => {
            $scope.close_dialog();
        }

        function convertFromFormDataToPermitObject(formData) {
            let permit = {
                First_Name: formData.First_Name || '',
                Middle_Initial: formData.Middle_Initial || '',
                Last_Name: formData.Last_Name || '',
                Extension: formData.Extension || '',
                Barangay: formData.Barangay || '',
                Municipality: formData.Municipality || '',
                Street: formData.Street || '',
                Purpose: formData.Purpose || '',
                Date_Issued: formData.Date_Issued || '',
                COR_Number: formData.COR_Number || '',
                id: formData.id || ''
            };

            return permit;
        }

        function converFromSnapshotToPermitObject(snapshot) {
            let permit = snapshot.data();
            permit.id = snapshot.id;

            permit.Barangay = permit.Barangay && permit.Barangay.toUpperCase() || '';

            if (permit.Date_Issued)
                permit.Date_Issued = new Date(permit.Date_Issued.seconds * 1000);
            return permit;
        }

    }).
    controller('CriminalCasesController', function ($crudService, $dateService, $addressService, $scope) {
        var criminalCasesDocument = db.collection('database').doc('CriminalCase');
        var criminalCasesCollection = criminalCasesDocument.collection('CriminalCases');
        var criminalCases = [];
        var countries = [];
        var provincies = [];
        var municipalities = [];
        var barangays = [];

        $scope.criminalCasesTable = new ngTable([]);
        $scope.criminalCasesFormData = {};

        $scope.refreshList = () => {
            $crudService.getItems(criminalCasesCollection, convertFromSnapshotToCriminalCase).then(cases => {
                criminalCases = cases;
                $scope.criminalCasesTable = new ngTable(criminalCases);
            })
        }

        function convertFromSnapshotToCriminalCase(snapshot) {
            var criminalCase = snapshot.data();
            criminalCase.id = snapshot.id;

            if (criminalCase.Date_Filed)
                criminalCase.Date_Filed = $dateService.convertToJSDate(criminalCase.Date_Filed);
            if (criminalCase.Fiscals_Resolution_Date)
                criminalCase.Fiscals_Resolution_Date = $dateService.convertToJSDate(criminalCase.Fiscals_Resolution_Date);
            if (criminalCase.Decision_Date)
                criminalCase.Decision_Date = $dateService.convertToJSDate(criminalCase.Decision_Date);
            if (criminalCase.Receipt_Date)
                criminalCase.Receipt_Date = $dateService.convertToJSDate(criminalCase.Receipt_Date);

            return criminalCase;
        }
    }).
    service('$crudService', function () {

        this.getItems = (collection, objectConverter) => {
            // var items = []
            if (!objectConverter)
                objectConverter = defaultObjectConverter;

            let promise = new Promise((resolve, reject) => {
                collection.onSnapshot(snapShot => {
                    let items = snapShot.docs.map(documentSnapshot => {
                        let item = objectConverter(documentSnapshot);

                        return item;
                    });

                    resolve(items);
                });
            });

            return promise;
        }

        this.getItem = (id, collection, objectConverter) => {
            if (!objectConverter)
                objectConverter = defaultObjectConverter;

            let promise = new Promise((resolve, reject) => {
                collection.doc(id).onSnapshot(documentSnapshot => {
                    let item = objectConverter(documentSnapshot);
                    resolve(item);
                });
            },
                error => {
                    reject(error);
                });

            return promise;
        }

        function defaultObjectConverter(documentSnapshot) {
            let item = documentSnapshot.data();
            item.id = documentSnapshot.id;

            return item;
        }

        this.addItem = (itemToAdd, collection) => {
            let promise = new Promise((resolve, reject) => {
                collection.add(itemToAdd).then(result => {
                    resolve();
                },
                    error => {
                        reject(error);
                    });
            })
            return promise;
        }

        this.updateItem = (item, collection) => {
            let promise = new Promise((resolve, reject) => {
                collection.doc(item.id).update(item).then(result => {
                    resolve();
                },
                    error => { reject(error); });
            })

            return promise;
        }

        this.updateCounterFor = (item, document) => {
            let promise = new Promise((resolve, reject) => {

                var counter = {};
                if (item.Year && item.Month) {
                    counter["yearlyCount.total"] = firebase.firestore.FieldValue.increment(1);
                    counter[`yearlyCount.${item.Year}.total`] = firebase.firestore.FieldValue.increment(1);
                    counter[`yearlyCount.${item.Year}.${item.Month}`] = firebase.firestore.FieldValue.increment(1);
                }

                if (item.Municipality) {
                    counter[`municipalityCount.${item.Municipality}`] = firebase.firestore.FieldValue.increment(1);
                }

                if (Object.keys(counter).length) {
                    document.update(counter).
                        then(result => {

                        },
                            error => {
                                console.log(error);
                            });
                }

            });

            return promise;
        }
    }).
    service('$dateService', function () {
        $this.convertToJSDate = (firebaseDate) => {
            return new Date(firebaseDate.seconds * 1000);
        }
    }).
    service('$addressService', function () {
        var countries = require('./json/coutries.json');
        var philippineProvinces = require('./json/philippineProvinces.json');

        this.getCountries = () => {
            return new Promise((resolve, reject) => {
                resolve(countries);
            });
        }

        this.getProvinces = (country) => {
            return new Promise((resolve, reject) => {
                resolve(philippineProvinces);
            });
        }

        this.getMunicipalities = (country, province) => {
            return new Promise((resolve, reject) => {
                var municipalities = [];
                if (country.toUpperCase() == 'PHILIPPINES')
                    municipalities = philippineProvinces[province];

                resolve(municipalities);
            })
        }

        this.getBarangays = (country, province, municipality) => {
            return new Promise((resolve, reject) => {
                var barangays = [];
                if (country.toUpperCase() == 'PHILIPPINES')
                    barangays = philippineProvinces[province][municipality];
                resolve(barangays);
            })
        }
    });

'use strict';

myAppModule.controller('fireDbCrtl', function ($scope, $timeout, $utils, $mdToast, $localStorage, $mdDialog) {
    var XLSX = require('xlsx');
    var user = $scope.user;
    $scope.db = {};
    var selectedDb = "";

    $scope.setDb = (s) => {
        selectedDb = s;
    }

    $scope.upload_excel = (f, t) => {
        if (uploading_type != '') return null;
        if (typeof (f) == typeof ([])) {
            uploading_type = t;
            var f = f[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                var data = e.target.result;
                data = new Uint8Array(data);
                let wb = XLSX.read(data, { type: 'array' });
                wb.SheetNames.forEach(element => {
                    if (t == 'wsup') $scope.wsup_data.push({ name: element, data: XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                });
            };
            reader.readAsArrayBuffer(f);
        } else {
            $scope.toast("file error");
        }
    }

    $scope.export_database_to_excel = (d, t) => {
        ipcRenderer.send('save_workbook_as_excel', d);
    }

    $scope.open_database = (t) => {
        $scope.open_window_view("app/pages/database/permits/single/sheets.html", t);
    };

    function newCtrl($scope, $mdDialog) {
        $scope.cancel = function () {
            $mdDialog.cancel();
        };
        $scope.createDB = (name) => {
            fire.db.datasets.query.add({
                "staff_id": user.id,
                "name": name,
                "date": Date.now()
            });
            $mdDialog.cancel();
        }
        $scope.createSheet = (name) => {
            let g = {
                "staff_id": user.id,
                "name": name,
                "date": Date.now()
            };
            fire.db.datasets.query.doc(selectedDb).collection("datasets").add(g);
            $mdDialog.cancel();
        }
    }

    var listener = {};
    listener["main"] = fire.db.datasets.query.where("staff_id", "==", user.id).onSnapshot(qs => {
        qs.forEach(doc => {
            $scope.db[doc.id] = { data: doc.data() };
            listener[doc.id] = fire.db.datasets.query.doc(doc.id).collection("datasets").onSnapshot(qs => {
                let x = {};
                let c = true;
                qs.forEach(doc => {
                    c = false;
                    x[doc.id] = doc.data();
                });
                $scope.db[doc.id].sheets = (c) ? null : x;
            });
        })
    });

    $scope.open_modal = (ev, template) => {
        $mdDialog.show({
            controller: newCtrl,
            templateUrl: template,
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true,
            fullscreen: true
        });
    }

});
'use strict';
myAppModule.controller('fuel_log_controller', function ($scope, $timeout, $utils, $mdDialog, $localStorage, $interval, $filter) {

    $scope.update_trip_ticket_form = false;
    $scope.ticket_clear = function () {
        $scope.new_ticket = { "data": { "passengers": [], "places": [] } };
        //document.getElementById("ngForm").reset();

        //$scope.form_new_document.$setPristine();
    };


    $scope.ticket_add = function (d) {// write to Database
        console.log(d);

        console.log("month");
        //$scope.is_single_account_selected = true;
        var q = {

            data: {
                action: "fuel/add",
                trip_ticket_id: d.ticket_number,
                data: d.data

            },
            callBack: function (data) {
                if (data.data.status == 0) {
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

    $scope.get_ticket_data = function () {
        //$scope.selected_account = s;
        var q = {
            data: {
                action: "fuel/get",

            },
            callBack: function (data) {
                $scope.ticket_data = $scope.ngTable(data.data.data);
                console.log($scope.ticket_data);
            }
        };

        $utils.api(q);
    };


    $scope.update_trip_ticket_data = function (trip_ticket_data) {
        $scope.update_trip_ticket_form = true;
        $scope.trip_ticket_ID = trip_ticket_data.trip_ticket_id;
        $scope.new_ticket = trip_ticket_data;
    }

    $scope.to_time = function (d) {
        return $filter('date')(d, "hh:mm:ss a");
    };

    $scope.ticket_update = function (new_data) {
        console.log(new_data);
        var q = {

            data: {
                action: "fuel/update_ticket",
                trip_ticket_id: new_data.trip_ticket_id,
                data: new_data.data

            },
            callBack: function (data) {
                if (data.data.status == 0) {
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


    $scope.update_selected_user = function (d) {

    };
});
'use strict';

myAppModule.controller('transactions_controller', function ($scope, $timeout, $utils, Upload, $mdDialog, NgTableParams, $http) {

    var APPLICANT_DB = new JsonDB("./DB/APPLICANTS", true, false);
    const applicant_string = "/applicants";
    var TRANSACTION_DB = new JsonDB("./DB/TRANSACTIONS", true, false);
    const incoming_string = "/incoming";

    try {
        TRANSACTION_DB.getData(incoming_string + "[0]");
        APPLICANT_DB.getData(applicant_string + "[0]");
    } catch (error) {
        TRANSACTION_DB.push(incoming_string, []);
        APPLICANT_DB.push(applicant_string, []);
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
    $scope.uploading_file = false;

    //load json data
    $http.get("./json/permitting/templates.json").then(function (data) {
        $scope.application_templates = data.data.data;
    });

    $scope.change_current_view = (p) => {
        $scope.current_page_view = "app/pages/transactions/views/" + p + ".html";
        $scope.current_active_view = p;
    }

    if ($scope.user.user_level == '7' || '8' || '4') {
        $scope.change_current_view('my_transactions');
    }

    $scope.invalidate_table = () => {
        let data = TRANSACTION_DB.getData(incoming_string);
        $scope.tbl_incoming = new NgTableParams({ sorting: { id: "desc" } }, { dataset: data });
    };

    $scope.set_application = (x) => {
        $scope.application = x;
        if ($scope.application.actions == undefined) $scope.application.actions = [];
        let www = fire.db.transactions.when(x.id, (d) => {
            $scope.application = d;
        })
    }

    $scope.add_tread = function (app_id, data) {
        // add to firebase
        if ($scope.application.actions == undefined) $scope.application.actions = [];
        $scope.application.actions.push({
            staff: $scope.user.data.first_name + " " + $scope.user.data.last_name,
            message: data,
            date: $scope.date_now()
        });
        fire.db.transactions.update(`${app_id}`, { "actions": $scope.application.actions });
    };

    $scope.upload_attachments = (files, app_id) => {
        var upload_file = (idx) => {
            $scope.uploading_file = true;
            let f = files[idx];
            var form = $utils.upload((data, code) => {
                $scope.uploading_file = false;
                if (code == 200) {
                    if (files.length == (idx + 1)) {
                        let m = `<a href="${api_address}/${data.data}" target="blank" download>${f.name}</a>`;
                        $scope.add_tread(app_id, m);
                    } else {
                        upload_file(idx + 1);
                    }
                }
            });
            form.append('action', 'user/upload_file');
            form.append('file', fs.createReadStream(f.path), { filename: f.name });
            form.append('user_id', $scope.user.id);
        };
        if (files.length > 0) upload_file(0);
    };

    $scope.load_html = (text, i) => {
        $timeout(
            () => {
                $(".convo_" + i).html(text);
            }, 50
        )
    }

    $scope.get_my_transactions = () => {
        $scope.user.user_level = parseInt($scope.user.user_level);
        var d = [];
        switch ($scope.user.user_level) {
            case 4:
                //executive director
                d = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == 5).reverse();
                break;
            case 5:
                //permitting staff
                d = TRANSACTION_DB.getData(incoming_string).filter(d => (d.status == 1)).reverse();
                break;
            case 7:
                // permitting chief
                d = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == 3).reverse();
                break;
            case 8:
                //operations director
                d = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == 4).reverse();
                break;
            default:
                break;
        }
        return d;
    };

    $scope.invalidate_my_transactions = () => {
        $scope.my_transactions = $scope.get_my_transactions();
    }

    $scope.get_user_by_id = (id) => {
        let data = USER_DB.getData(user_string);
        for (let x of data) {
            if (x.id == id) return x;
        }
        return undefined;
    }

    $scope.filter_incoming = (selector) => {
        $scope.dataSelector = selector;
        if (selector == "") {
            $scope.invalidate_table();
        } else {
            let data = TRANSACTION_DB.getData(incoming_string).filter(d => d.status == selector);
            $scope.tbl_incoming = new NgTableParams({ sorting: { id: "desc" } }, { dataset: data });
        }
    }

    $scope.open_single = (x, ev) => {
        $scope.application = {};
        TRANSACTION_DB.getData(incoming_string).forEach(element => {
            if (element.id == x.id) {
                $scope.application = element;
                $scope.showPrerenderedDialog(ev, 'receiveSingleTransaction');
                return;
            }
        });
    }

    //$scope.filter_incoming($scope.dataSelector);
    $scope.db_changes = (DB, st, d, item, callBack) => {
        let index = 0;
        DB.getData(st).forEach(element => {
            if (element.id == item.id) {
                DB.push(st + "[" + index + "]", d);
                // item = d;
                $timeout(() => { if (callBack != undefined) callBack(); }, 200);
                return;
            } else {
                index++;
            }
        });
    }


    $scope.update_single = (x) => {
        if ($scope.update_queue == 0) {
            $scope.update_queue = 1;
            let q = {
                data: {
                    action: "applicant/transaction/get",
                    id: x.id,
                    user_id: $scope.user.id
                },
                callBack: (data) => {
                    $scope.update_queue = 0;
                    if (data.data.status == 1) {
                        $scope.db_changes(TRANSACTION_DB, incoming_string, data.data.data, x, () => { $scope.filter_incoming($scope.dataSelector); });
                    }
                }
            };
            $utils.api(q);
        }
    }

    $scope.getTransactionStatus = (n) => {
        if (n == 0) return "New";
        if (n == 1) return "On-Review";
        if (n == 2) return "Declined";
        if (n == 3) return "Proccesing";
        if (n == 4) return "For Approval";
        if (n == 5) return "For Acknowledgement";
        if (n == 6) return "Acknowledged, Permit Complete";
        if (n == 7) return "Used";
    };

    $scope.download_incoming = () => {
        $scope.invalidate_table();
        $scope.is_loading = true;
        let d = TRANSACTION_DB.getData(incoming_string);
        let l = (d.length > 0) ? d[d.length - 1].id : 0;
        let current_length = d.length;
        let q = {
            data: {
                action: "applicant/transaction/load",
                offset: current_length,
                last_id: l,
                user_id: $scope.user.id
            },
            callBack: (data) => {
                if (data.data.status == 1) {
                    $scope.is_loading = false;
                    TRANSACTION_DB.push(incoming_string, data.data.data, false);
                    $timeout($scope.download_incoming, 50);
                } else {
                    $timeout(() => { $scope.filter_incoming($scope.dataSelector); }, 100);
                    $scope.is_loading = false;

                    TRANSACTION_DB.getData(incoming_string).forEach(element => {
                        //firebase update
                        let z = element;
                        fire.db.transactions.get(`${z.id}`, (dd) => {
                            if (dd == undefined) {
                                fire.db.transactions.set(`${z.id}`, z);
                                fire.db.transactions.when(z.id, (d) => {
                                    $scope.update_single(d);
                                });
                            } else {
                                fire.db.transactions.when(z.id, (d) => {
                                    $scope.update_single(d);
                                });
                            }
                        });
                    });


                }
            },
            errorCallBack: () => {
                $timeout(() => { $scope.filter_incoming($scope.dataSelector); }, 100);
                $scope.is_loading = false;
            }
        };
        $utils.api(q);
    };

    $scope.receive_single = (x) => {
        $scope.is_single_loading = true;
        let q = {
            data: {
                action: "applicant/transaction/receive",
                id: x.id,
                staff_id: $scope.user.id
            },
            callBack: (data) => {
                $scope.is_single_loading = false;
                if (data.data.status == 1) {
                    $scope.db_changes(TRANSACTION_DB, incoming_string, data.data.data, x, () => { $scope.filter_incoming($scope.dataSelector); });
                    $scope.close_dialog();
                }
            },
            errorCallBack: () => {
                $scope.toast("OFFLINE, try again later...")
            }
        };
        $utils.api(q);
    }

    $scope.download_applicant = () => {
        let d = APPLICANT_DB.getData(applicant_string);
        let l = (d.length > 0) ? d[d.length - 1].id : 0;
        let current_length = d.length;
        let q = {
            data: {
                action: "applicant/account/load",
                offset: current_length,
                last_id: l,
                user_id: $scope.user.id
            },
            callBack: (data) => {
                if (data.data.status == 1) {
                    APPLICANT_DB.push(applicant_string, data.data.data, false);
                    $timeout($scope.download_applicant, 50);
                }
            }
        };
        $utils.api(q);
    };

    $scope.rejectApplication = (x, ev) => {
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

        $mdDialog.show(confirm).then(function (result) {
            $scope.application_loading = true;
            let q = {
                data: {
                    action: "applicant/transaction/reject",
                    remark: result,
                    id: x.id,
                    user_id: $scope.user.id
                },
                callBack: (data) => {
                    $scope.application_loading = false;
                    if (data.data.status == 1) {
                        $scope.add_tread(x.id, result);
                        $scope.db_changes(TRANSACTION_DB, incoming_string, data.data.data, x, () => {
                            $scope.invalidate_my_transactions();
                        });
                        $scope.application = undefined;
                        fire.db.transactions.update(`${x.id}`, data.data.data);
                    } else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function () {
            // cancel
        });
    }

    $scope.acceptApplication = (x, ev) => {
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

        $mdDialog.show(confirm).then(function (result) {
            $scope.application_loading = true;
            let q = {
                data: {
                    action: "applicant/transaction/accept",
                    remark: result,
                    id: x.id,
                    user_id: $scope.user.id,
                    certificate_of_inspection: x.certificate_of_inspection,
                    payment_slip: x.payment_slip
                },
                callBack: (data) => {
                    $scope.application_loading = false;
                    if (data.data.status == 1) {
                        $scope.add_tread(x.id, result);
                        $scope.application = undefined;
                        $scope.db_changes(TRANSACTION_DB, incoming_string, data.data.data, x, () => {
                            $scope.invalidate_my_transactions();
                        });
                        fire.db.transactions.update(`${x.id}`, data.data.data);
                    } else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function () {
            // cancel
        });
    }

    $scope.approveApplication = (x, ev) => {
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

        $mdDialog.show(confirm).then(function (result) {
            $scope.application_loading = true;
            let q = {
                data: {
                    action: "applicant/transaction/approve",
                    remark: result,
                    id: x.id,
                    user_id: $scope.user.id
                },
                callBack: (data) => {
                    $scope.application_loading = false;
                    if (data.data.status == 1) {
                        $scope.add_tread(x.id, result);
                        $scope.application = undefined;
                        $scope.db_changes(TRANSACTION_DB, incoming_string, data.data.data, x, () => {
                            $scope.invalidate_my_transactions();
                        });
                        fire.db.transactions.update(`${x.id}`, data.data.data);
                    } else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function () {
            // cancel
        });
    }

    $scope.recommendApplication = (x, ev) => {
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

        $mdDialog.show(confirm).then(function (result) {
            $scope.application_loading = true;
            let q = {
                data: {
                    action: "applicant/transaction/recommend",
                    remark: result,
                    id: x.id,
                    user_id: $scope.user.id
                },
                callBack: (data) => {
                    $scope.application_loading = false;
                    if (data.data.status == 1) {
                        $scope.add_tread(x.id, result);
                        $scope.application = undefined;
                        $scope.db_changes(TRANSACTION_DB, incoming_string, data.data.data, x, () => {
                            $scope.invalidate_my_transactions();
                        });
                        fire.db.transactions.update(`${x.id}`, data.data.data);
                    } else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function () {
            // cancel
        });
    }

    $scope.acknowledgeApplication = (x, ev) => {
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

        $mdDialog.show(confirm).then(function (result) {
            $scope.application_loading = true;
            let q = {
                data: {
                    action: "applicant/transaction/acknowledge",
                    remark: result,
                    id: x.id,
                    user_id: $scope.user.id
                },
                callBack: (data) => {
                    $scope.application_loading = false;
                    if (data.data.status == 1) {
                        $scope.add_tread(x.id, result);
                        $scope.application = undefined;
                        $scope.db_changes(TRANSACTION_DB, incoming_string, data.data.data, x, () => {
                            $scope.invalidate_my_transactions();
                        });
                        fire.db.transactions.update(`${x.id}`, data.data.data);
                    } else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function () {
            // cancel
        });
    }

    $scope.returnApplication = (x, ev) => {
        var confirm = $mdDialog.prompt()
            .title('Return last process')
            .textContent('Reason')
            .placeholder('')
            .ariaLabel('Reason')
            .initialValue('')
            .targetEvent(ev)
            .required(true)
            .ok('Return')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function (result) {
            $scope.application_loading = true;
            let q = {
                data: {
                    action: "applicant/transaction/return",
                    remark: result,
                    id: x.id,
                    user_id: $scope.user.id
                },
                callBack: (data) => {
                    $scope.application_loading = false;
                    if (data.data.status == 1) {
                        $scope.db_changes(TRANSACTION_DB, incoming_string, data.data.data, x, () => {
                            $scope.invalidate_my_transactions();
                        });
                        $scope.add_tread(x.id, result);
                        $scope.application = undefined;
                        fire.db.transactions.update(`${x.id}`, data.data.data);
                    } else {
                        $scope.toast(data.data.error + "  : " + data.data.hint);
                    }
                }
            };
            $utils.api(q);
        }, function () {
            // cancel
        });
    }

});
myAppModule.controller('jao_controller', function ($scope, $localStorage, $utils, $http) {
    $scope.Accounting_JAO = $localStorage.Accounting_JAO || [];
    $scope.Accounting_JAO1 = $localStorage.Accounting_JAO1 || [];
    //$scope.Accounting_Year = $localStorage.Accounting_Year || [];
    $scope.Accounting_Year;
    $scope.Accounting_Month
    $scope.Accounting_DIVISION;
    $scope.Accounting_AllotClass;

    $scope.jaoBudgetMOOE_add = function (d, e) {
        //var databudget = Object.assign(e.data,d.data);

        var q = {

            data: {
                action: "Accounting/jao/addBudget",
                Year: d.YearBudget,
                Division: d.divisionBudget,
                AllotmentClass: "Maintenance and Other Operating Expenses",
                Month: e.Month,
                data: e.data

            },
            callBack: function (data) {
                if (data.data.status == 0) {
                    $scope.toast(data.data.error + "  : " + data.data.hint);
                }

                else {
                    $scope.toast(data.data.data);
                }
            }
        };
        $utils.api(q);

    }

    $scope.jaoBudgetPS_add = function (d, e) {
        var databudget = Object.assign(e.data, d.data);

        var q = {

            data: {
                action: "Accounting/jao/addBudget",
                Year: d.YearBudget,
                Division: d.divisionBudget,
                AllotmentClass: "Personal Services",
                Month: e.Month,
                data: e.data

            },
            callBack: function (data) {
                if (data.data.status == 0) {
                    $scope.toast(data.data.error + "  : " + data.data.hint);
                }

                else {
                    $scope.toast(data.data.data);
                }
            }
        };
        $utils.api(q);
    }

    $scope.jaoBudgetCO_add = function (d, e) {


        var databudget = Object.assign(e.data, d.data);

        var q = {

            data: {
                action: "Accounting/jao/addBudget",
                Year: d.YearBudget,
                Division: d.divisionBudget,
                AllotmentClass: "Capital Overlay",
                Month: e.Month,
                data: e.data

            },
            callBack: function (data) {
                if (data.data.status == 0) {
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

    $http.get('app/pages/Accounting/JAO/data.json').then((data) => {
        // console.log(data);
        $scope.jsondata = data.data;
        typeclass = data.data;

    });

    var aYear, aMonth, aDivision, aAllotClass;


    //$scope.Accounting_Month = $localStorage.Accounting_Month || [];

    $scope.trylang = function () {
        $scope.is_single_account_selected = true;
        $scope.open_view_Budget = true;
        $scope.disabled1 = true;
        $scope.disabled2 = true;
        $scope.disabled3 = true;

    };

    $scope.type_EDis = (s) => {
        console.log(s);

        // $scope.selected_account = s;
        if (s == "Personal Services") {
            $scope.PST = typeclass.PS;
        }
        else if (s == "Maintenance and Other Operating Expenses") {
            $scope.PST = typeclass.MOOE;
        }
        else if (s == "Capital Overlay") {
            $scope.PST = typeclass.CO;
        }
        $scope.is_single_account_selected = false;
    };



    $scope.open_selected_account = () => {
        //$scope.selected_account = s;
        //$scope.is_single_account_selected = false;

        $scope.ViewExpenses = $scope.templates[8];

        var q = {
            data: {
                action: "Accounting/jao/get",
                Month_Date: aMonth,
                Year_Date: aYear,
                DIVISION: aDivision,
                AllotmentClass: aAllotClass

            },
            callBack: function (data) {
                $localStorage.Accounting_JAO = $scope.JAO_List = $scope.ngTable(data.data.data);
                $localStorage.Accounting_JAO1 = data.data.data;
            }
        };
        $utils.api(q);

        $scope.YearData = aYear;
        $scope.MonthData = aMonth;
        $scope.DivisionData = aDivision;
        $scope.ACData = aAllotClass;
    };

    $scope.SData = function (d) {
        //console.log(d);
        aYear = d;
        console.log(aYear);
        $scope.disabled1 = false;

        var q = {
            data: {
                action: "Accounting/jao/getMonth",
                //date : d
                Year_Date: d

            },
            callBack: function (data) {
                $scope.Accounting_Month = data.data.data;
            }
        };
        $utils.api(q);


    };

    $scope.DData = function (d) {
        //console.log(d);
        aMonth = d;
        console.log(aMonth);
        $scope.disabled2 = false;

        var q = {
            data: {
                action: "Accounting/jao/getDivision",
                Month_Date: aMonth,
                Year_Date: aYear

            },
            callBack: function (data) {
                $scope.Accounting_DIVISION = data.data.data;

            }
        };
        $utils.api(q);

    }

    $scope.EData = function (d) {

        console.log(d);
        $scope.disabled3 = false;
        aDivision = d;


        var q = {
            data: {
                action: "Accounting/jao/getAllotClass",
                Month_Date: aMonth,
                Year_Date: aYear,
                DIVISION: aDivision

            },
            callBack: function (data) {
                $scope.Accounting_AllotClass = data.data.data;

            }
        };
        $utils.api(q);
    }

    $scope.FData = function (d) {
        console.log(d);
        aAllotClass = d;

    }



    $scope.get_year = function () {
        var q = {
            data: {
                action: "Accounting/jao/getYear",

            },
            callBack: function (data) {
                $scope.Accounting_Year = data.data.data;

            }
        };
        $utils.api(q);
    };

    $scope.jao = {};

    $scope.jao_add = function (d) {


        obj = JSON.parse(d.expenses);
        console.log(obj);
        console.log(obj.hello);

        month = $scope.to_month(d.data.date);
        year = $scope.to_year(d.data.date);
        var q = {
            data: {
                action: "Accounting/jao/getBudget",
                Year: year,
                Month: month,
                AllotmentClass: d.allotment,
                Division: d.division,

            },
            callBack: function (data) {

                amount = data.data.data;

                console.log(amount);

                var results = [];


                for (var i = 0; i < amount.length; i++) {//get amountbudget
                    results.push(amount[i].data.BuildingBudget);
                }
                console.log(results);

                var TotalBudget = 0;

                for (var i = 0; i < results.length; i++) {//get totalamountbudget
                    TotalBudget += results[i];
                }
                console.log(TotalBudget);

                if (TotalBudget >= d.data.amount) {
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
                else {
                    console.log("Wala");
                }

            }
        };
        $utils.api(q);

    }

    $scope.get_jao = function () {

    };

    $scope.ShowSearchExpenses = function () {

        $scope.ViewExpenses = $scope.templates[7];

    }

    $scope.view_budget = function () {

        $scope.ViewExpenses = $scope.templates[9];

        var q = {
            data: {
                action: "Accounting/jao/getBudget",

            },
            callBack: function (data) {
                $scope.JAOBudget = $scope.ngTable(data.data.data);
                $scope.JaoBudgetlist = data.data.data;

            }
        };
        $utils.api(q);

        console.log(JAOBudget);


    }


    $scope.templates =
        [{ name: 'template1.html', url: './app/pages/Accounting/JAO/template1.html' },
        { name: 'template2.html', url: './app/pages/Accounting/JAO/template2.html' },
        { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AddExpenses.html' },
        { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AllotmentPages/PS.html' },
        { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AllotmentPages/MOOE.html' },
        { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AllotmentPages/CO.html' },
        { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/AddBadget.html' },
        { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/viewExpenses.html' },
        { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/viewData.html' },
        { name: 'template2.html', url: './app/pages/Accounting/JAO/Pages/viewBudget.html' }];

    $scope.template = $scope.templates[0];
    $scope.AddExpenses = $scope.templates[2];
    $scope.AB_Allot_PS = $scope.templates[3];
    $scope.AB_Allot_MOOE = $scope.templates[4];
    $scope.AB_Allot_CO = $scope.templates[5];
    $scope.AddBudgets = $scope.templates[6];
    $scope.ViewExpenses = $scope.templates[7];



})
'use strict';
myAppModule.controller('database_admin_cases_controller', function ($scope, $timeout, $utils, $mdToast, $localStorage) {
    $scope.list_admin_cases = [
        { name: "Admin Order 5, Series 2014", value: "AO-5-2014" },
        { name: "Admin Order 6, Series 2014", value: "AO-6-2014" }
    ];

});
'use strict';

myAppModule.controller('database_permit_controller', function ($scope, $timeout, $utils, $mdToast, $localStorage) {
    var XLSX = require('xlsx');
    $scope.wsup_data = [];
    $scope.sep_data = [];
    $scope.apprehension_data = [];
    $scope.admin_cases_data = [];
    var uploading_type = '';
    $scope.is_loading = false;
    $scope.is_deleting = { value: false, type: '' };
    var PERMITS_DB = new JsonDB(dbFolder + "PERMITS", true, false);

    $scope.permit_types = [
        { code: "wsup", name: "Wildlife Special Use Permit" },
        { code: "sep", name: "Strategic Environmental Plan (SEP) Permit" },
        { code: "apprehension", name: "PCSD Apprehension" },
        { code: "admin_cases", name: "PAB Admin Cases" }
    ];
    $scope.permit_types.forEach(pt => {
        let zx = () => {
            if (pt.code == 'wsup') $scope.wsup_data = PERMITS_DB.getData("/" + pt.code);
            if (pt.code == 'sep') $scope.sep_data = PERMITS_DB.getData("/" + pt.code);
            if (pt.code == 'apprehension') $scope.apprehension_data = PERMITS_DB.getData("/" + pt.code);
            if (pt.code == 'admin_cases') $scope.admin_cases_data = PERMITS_DB.getData("/" + pt.code);
        };
        try {
            zx();
        } catch (error) {
            PERMITS_DB.push("/" + pt.code, []);
        };
        //firebase
        fire.db.datasets.get(pt.code, (z) => {
            if (z == undefined) {
                fire.db.datasets.set(pt.code, { data: [] });
            } else {
                PERMITS_DB.push("/" + pt.code, z.data);
                zx();
            }
            //realtime updates
            fire.db.datasets.when(pt.code, (c) => {
                PERMITS_DB.push("/" + pt.code, c.data);
                zx();
            });
        });
    });

    $scope.get_data_scope = (t) => {
        if (t == 'wsup') return $scope.wsup_data;
        if (t == 'sep') return $scope.sep_data;
        if (t == 'apprehension') return $scope.apprehension_data;
        if (t == 'admin_cases') return $scope.admin_cases_data;
    }

    $scope.initialize_data = (t) => {
        let x = PERMITS_DB.getData("/" + t);
        return (x.length > 0) ? x : [];
    }

    $scope.search_from_db = (q, t) => {
        let x = PERMITS_DB.getData("/" + t);
        var results = [];
        x.forEach(element => {
            element.data.forEach(item => {
                let p = false;
                for (const key in item) {
                    if (item[key] == q) p = true;
                }
                if (p) results.push(item);
            });
        });
        return results;
    }

    $scope.check_empty = (t) => { return (PERMITS_DB.getData("/" + t).length > 0) ? false : true }

    $scope.upload_excel = (f, t) => {
        if (uploading_type != '') return null;
        if (typeof (f) == typeof ([])) {
            uploading_type = t;
            var f = f[0];
            var reader = new FileReader();
            reader.onload = function (e) {
                var data = e.target.result;
                data = new Uint8Array(data);
                let wb = XLSX.read(data, { type: 'array' });
                wb.SheetNames.forEach(element => {
                    if (t == 'wsup') $scope.wsup_data.push({ name: element, data: XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                    if (t == 'sep') $scope.sep_data.push({ name: element, data: XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                    if (t == 'apprehension') $scope.apprehension_data.push({ name: element, data: XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                    if (t == 'admin_cases') $scope.admin_cases_data.push({ name: element, data: XLSX.utils.sheet_to_json(wb.Sheets[element]) });
                });
                uploading_type = '';
                PERMITS_DB.push("/" + t, []);
            };
            reader.readAsArrayBuffer(f);
        } else {
            $scope.toast("file error");
        }
    }

    $scope.uploading_excel = (t) => {
        return (uploading_type == t) ? true : false;
    }

    $scope.delete_excel = (t) => {
        fire.db.datasets.update(t, { data: [] });
        if (t == 'wsup') { $scope.wsup_data.splice(0, $scope.wsup_data.length); }
        if (t == 'sep') { $scope.sep_data.splice(0, $scope.sep_data.length); }
        if (t == 'apprehension') { $scope.apprehension_data.splice(0, $scope.apprehension_data.length); }
        if (t == 'admin_cases') { $scope.admin_cases_data.splice(0, $scope.admin_cases_data.length); }
        PERMITS_DB.push("/" + t, []);

    }

    $scope.cancel_excel = (t) => {
        if (t == 'wsup') $scope.wsup_data.splice(0, $scope.wsup_data.length);
        if (t == 'sep') $scope.sep_data.splice(0, $scope.sep_data.length);
        if (t == 'apprehension') $scope.apprehension_data.splice(0, $scope.apprehension_data.length);
        if (t == 'admin_cases') $scope.admin_cases_data.splice(0, $scope.admin_cases_data.length);
    }

    var calculate_items = (d) => {
        let i = 0;
        d.forEach(j => {
            i = i + j.data.length;
        });
        return i;
    }

    $scope.save_database = (d, t) => {
        $scope.toast("Data saved");
        PERMITS_DB.push("/" + t, d);
        fire.db.datasets.update(t, { data: d });

        // async function createDatabase ()  {
        //     await fire.db.database.query.doc("WSUP").set({"id":"WSUP"});
        //     console.log("DB Created");
        //     d[0].data.forEach( async (e) => {
        //         let i = {};
        //         for (const key in e) {
        //             if (e.hasOwnProperty(key)) {
        //                 const element = (e[key] != undefined)? e[key] : '';
        //                 i[key] = element;
        //             }
        //         }
        //         i.name = (e.First_Name  || '') + " " + (e.Middle_Name || '') + " " + (e.Last_Name || '') + " " + (e.Extension_Name || '');
        //         i.address = (e.Street || '') + ", " + (e.Barangay || '') + ", " + (e.Municipality || '');
        //         if(e.Issued_Year && e.Issued_Month && e.Issued_Day){
        //             i.Issued_Date = e.Issued_Year + "-" + e.Issued_Month + "-" + e.Issued_Day;
        //         }
        //         if(e.Validity_Year && e.Validity_Month && e.Validity_Day) {
        //             i.Validity_Date = e.Validity_Year + "-" + e.Validity_Month + "-" + e.Validity_Day;
        //         }
        //         i.keywords = i.name.split(' ').filter( d => d.length > 1);
        //         await fire.db.database.query.doc("WSUP").collection("database").add(i);
        //         let u = {};
        //         u["count.all"] = firebase.firestore.FieldValue.increment(1);
        //         if(e.Issued_Year != undefined) u[`count.${e.Issued_Year}.total`] = firebase.firestore.FieldValue.increment(1);
        //         if(e.Issued_Month != undefined) u[`count.${e.Issued_Year}.${e.Issued_Month}`] = firebase.firestore.FieldValue.increment(1);
        //         if(e.Municipality != undefined) u[`per_municipality.${e.Municipality}`] = firebase.firestore.FieldValue.increment(1);
        //         await fire.db.database.query.doc("WSUP").update(u);
        //     });
        // };
        // createDatabase();


        // let vv = [ 'Corporation ', 'Last_Name'];

        // vv.forEach(v => {
        //     let mun = {};
        //     d[0].data.forEach(e => {
        //         if(e[v] != undefined)
        //             mun[e[v]] = (mun[e[v]] == undefined)? 1 : mun[e[v]] + 1;
        //     });
        //     console.log(mun);
        // });


    }

    $scope.export_database_to_excel = (d, t) => {
        ipcRenderer.send('save_workbook_as_excel', d);
    }

    $scope.open_database = (t) => {
        $scope.open_window_view("app/pages/database/permits/single/sheets.html", t);
    };

    $scope.set_changed = (x) => {
        $scope.changed = x;
    }

    $scope.check_loading = (t) => {
        return ($scope.is_loading.value == true && $scope.is_loading.type == t);
    }

    $scope.check_deleting = (t) => {
        return ($scope.is_deleting.value == true && $scope.is_deleting.type == t);
    }

});