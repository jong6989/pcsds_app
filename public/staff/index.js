'use strict';
// var cloud_function_api = "https://us-central1-pcsd-brain-systems.cloudfunctions.net/";
var cloud_function_api = "https://us-central1-pcsd-app.cloudfunctions.net/"; 
//angularjs main
var script_angular = `
        <script src="/js/angular.min.js"></script>
        <script src="/js/angular-route.js"></script>
        <script src="/js/angular-animate.min.js"></script>
        <script src="/js/angular-aria.min.js"></script>
        <script src="/js/angular-messages.min.js"></script>
        <script src="/js/angular-material.min.js"></script>
        <script src="/js/ngStorage.min.js"></script>
        <script src="/js/ng-table.min.js"></script>
        <script src="/js/ng-file-upload-bower-12.2.13/ng-file-upload-shim.js"></script>
        <script src="/js/ng-file-upload-bower-12.2.13/ng-file-upload.min.js"></script>
        <script src="/js/webcam.min.js"></script>
        <script src="/js/ng-camera.js"></script>
        <script src="/js/ng-image-crop/ng-img-crop.js"></script>
        <script src="/js/html2canvas/html2canvas.min.js"></script>
        <script src="/plugins/ng-image-gallery/dist/ng-image-gallery.js"></script>
        <script src="/plugins/angular-uuid/angular-uuid.js"></script>
        <link href="/plugins/ng-image-gallery/dist/ng-image-gallery.css" rel="stylesheet"/>
        <link href="/css/mapbox-gl.css" rel="stylesheet"/>
        <script src="/js/mapbox-gl.js"></script>
        <script src="/js/tinycolor2/dist/tinycolor-min.js"></script>
        <script src="/js/angular-bootstrap-colorpicker/js/bootstrap-colorpicker-module.min.js"></script>
        <link rel="stylesheet" href="/js/angular-bootstrap-colorpicker/css/colorpicker.css"/>

        <script src="/js/ng-infinite-scroll/build/ng-infinite-scroll.min.js"></script>
        <link rel="stylesheet" href="/js/bootstrap/dist/css/bootstrap.css">
        <link rel="stylesheet" href="/js/angularjs-bootstrap-datetimepicker/src/css/datetimepicker.css"/>
        <script type="text/javascript" src="/js/angularjs-bootstrap-datetimepicker/src/js/datetimepicker.js"></script>
        <script type="text/javascript" src="/js/angularjs-bootstrap-datetimepicker/src/js/datetimepicker.templates.js"></script>
        <script src="/js/rxjs.umd.min.js"></script>
    `;
//angularjs plugins
var script_ng_plugins = {
    dashboard : `
        <script src="/plugins/momentjs/moment.js"></script>
        <script src="/js/signature_pad.min.js"></script>
        <script src="/js/quill.js"></script>
        <script src="/js/tinymce.min.js"></script>
        <script src="/js/xlsx/xlsx.full.min.js"></script>
        <script src="/js/qrcode.min.js"></script>
        <script src="/plugins/dot-object.min.js"></script>
        <script src="/plugins/hammer.min.js"></script>
    `
};
//angularjs controllers 
var scripts_controllers = {
    main : `<script src="app/app.js"></script>`,
    login : `<script src="app/login/controller.js"></script>`,
    chainsaw_monitoring: '<script src="app/templates/templates/monitoring/controller.js"></script>',
    receipt: '<script src="app/receipt/controller.js"></script>'
};
var scripts_js_plugins = {
    particles : `<script src="/plugins/particlesjs/js/particles.min.js"></script>
                <script src="/plugins/particlesjs/js/app.js"></script>`,
    export : `<script src="/js/export/shim.min.js"></script>
                <script src="/js/export/xlsx.core.min.js"></script>
                <script src="/js/export/xls.core.min.js"></script>
                <script src="/js/export/Blob.js"></script>
                <script src="/js/export/FileSaver.js"></script>`
}

//scripts for login user
let loginPage = script_angular + scripts_controllers.main + scripts_controllers.login;

function setJson(obj) {
    return JSON.stringify(obj);
}
function getJson(string) {
    return JSON.parse(string);
}

const Toast = Swal.mixin({
    toast: true,
    position: 'center',
    showConfirmButton: false,
    timer: 2000
});


async function authenticateStaff(){
    let v = localData.get('staff_current_view');
    
    if(!v){
        localData.set('staff_current_view','app/login/view.html');
    }
    

    let account_id = localData.get('BRAIN_STAFF_ID');
    let searchParams = window.location.search;
    let id = searchParams.substr(12,13);
    let token_key = "?user_token="
    let key = searchParams.slice(0,12);
    
    if(account_id){
        if(key == token_key && account_id != id){
            loadAccount(id);
        }
        //get stored staff json data
        let storedAccountData = localData.get('STAFF_ACCOUNT');
        
        if(storedAccountData != undefined){
            var account = getJson(storedAccountData);
            try {
                //render controllers
                let controllers = '';
                account.menu.map(o => {
                    controllers += o.controller;
                });
                
                localData.set('staff_current_view','app/main.html');
                let dashboardPage = 
                    script_ng_plugins.dashboard + 
                    script_angular  + 
                    scripts_controllers.main + 
                    scripts_controllers.chainsaw_monitoring +
                    scripts_controllers.receipt +
                    controllers;
                document.write(dashboardPage);
            } catch (error) {
                alert(error);
            }
        }
        
       
        //firebase authentication checker
        // await firebase.auth().onAuthStateChanged( async (user)=> {
        //     if (!user) {
        //         localData.remove('BRAIN_STAFF_ID');
        //         localData.remove('STAFF_ACCOUNT');
        //         localData.remove('staff_current_view');
        //         location.reload();
        //     }else {
        //         //get account data
        //         let q = await db.collection('staffs').doc(account_id).get();
        //         let acc = q.data();
        //         acc.id = q.id;

        //         localData.set('STAFF_ACCOUNT',setJson(acc));
        //         if(!storedAccountData) location.reload();
        //     }
        // });
    }else {
        document.write(loginPage);
        if(key == token_key) loadAccount(id);
    }
}

//debug user
localData.set('BRAIN_STAFF_ID','+639123456789');
localData.set('STAFF_ACCOUNT',`
    {
        "designation":"admin",
        "id":"+639486601717",
        "last_seen":1570521763344,
        "uid": "BI4OjCp0BDQQl8CYhVtsVtNKmG03",
        "menu":[
            {
                "controller":"<script src='app/account_management/controller.js'></script><script src='app/account_management/menus/controller.js'></script><script src='app/account_management/document_network/controller.js'></script>",
                "functions":["create","update","assign_module","disable"],
                "icon":"user-md",
                "title":"Account Management",
                "menu" : [
                    {
                        "title" : "Accounts",
                        "path" : "/account_management",
                        "icon" : "users"
                    },
                    {
                        "title" : "Menu Modules",
                        "path" : "/account_management/menus",
                        "icon" : "bars"
                    },
                    {
                        "title" : "DocNet Offices",
                        "path" : "/account_management/document_network/create_office",
                        "icon" : "users"
                    }
                ]
            },
            {
                "controller":"<script src='app/doc/controller.js'></script>",
                "icon":"file-text",
                "path":"/doc",
                "title":"Document Network"
            },
            {
                "controller":"<script src='app/operations/mapping/controller.js'></script>",
                "icon":"map",
                "title":"Mapping",
                "menu": [
                    {
                        "title": "Map Plan",
                        "path": "/operations/mapping/map/operations",
                        "icon": "map"
                    },
                    {
                        "title": "Track Recordings",
                        "path": "/operations/mapping/map/trackrecords",
                        "icon": "street-view"
                    },
                    {
                        "title": "Live Track Recordings",
                        "path": "/operations/live_tracking",
                        "icon": "street-view"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/summary_of_information/controller.js'></script>",
                "icon":"align-right",
                "title":"Summary of Information",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/operations/summary_of_information/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/summary_of_information/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/summary_of_information/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/surveillance_report/controller.js'></script>",
                "icon":"align-right",
                "title":"Surveillance Report",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/operations/surveillance_report/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/surveillance_report/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/surveillance_report/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/intel_report/controller.js'></script>",
                "icon":"align-right",
                "title":"Intelligence Report",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/operations/intel_report/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/intel_report/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/intel_report/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/monitoring/controller.js'></script>",
                "icon":"align-right",
                "title":"Monitoring Report",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/monitoring/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/monitoring/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/monitoring/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/evaluation/controller.js'></script>",
                "icon":"align-right",
                "title":"Evaluation",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/evaluation/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/evaluation/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/evaluation/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/certification/controller.js'></script>",
                "icon":"align-right",
                "title":"No-Pending-Case",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/certification/npc/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/certification/npc/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/certification/npc/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/certification/controller.js'></script>",
                "icon":"align-right",
                "title":"LTP Inspection'",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/certification/ltp/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/certification/ltp/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/certification/ltp/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/applications/controller.js'></script>",
                "icon":"files-o",
                "path":"/applications",
                "title":"Online Application"
            },
            {
                "controller":"<script src='app/permit_application/view/controller.js'></script>",
                "icon":"files-o",
                "title":"Permit Applications",
                "menu" : [
                    {
                        "title" : "View",
                        "path" : "/permit_application/view",
                        "icon" : "files-o"
                    },
                    {
                        "title" : "Legal Staff",
                        "path" : "/permit_application/legal_staff",
                        "icon" : "legal"
                    },
                    {
                        "title" : "Enforcement Staff",
                        "path" : "/permit_application/enforcement_staff",
                        "icon" : "files-o"
                    },
                    {
                        "title" : "Permitting Staff",
                        "path" : "/permit_application/permitting_staff",
                        "icon" : "files-o"
                    },
                    {
                        "title" : "Registry Staff",
                        "path" : "/permit_application/registry_staff",
                        "icon" : "files-o"
                    }
                ]
            },
            {
                "controller":"<script src='app/database/controller.js'></script>",
                "icon":"database",
                "title":"Data Sets",
                "menu": [
                    {
                        "title": "Statistics",
                        "path": "/database/views/statistics",
                        "icon": "line-chart"
                    },
                    {
                        "title": "Apprehensions",
                        "path": "/database/views/apprehension",
                        "icon": "legal"
                    },
                    {
                        "title": "Chainsaw Permit To Purchase",
                        "path": "/database/views/chainsaw_purchase_permit",
                        "icon": "file"
                    },
                    {
                        "title": "Chainsaw Registration",
                        "path": "/database/views/chainsaw_registration",
                        "icon": "registered"
                    },
                    {
                        "title": "Chainsaw Permit To Sell",
                        "path": "/database/views/chainsaw_sell_permit",
                        "icon": "file"
                    },
                    {
                        "title": "Wildlife Special Use Permit",
                        "path": "/database/views/wsup",
                        "icon": "leaf"
                    },
                    {
                        "title": "CITES (Export)",
                        "path": "/database/views/cites/export",
                        "icon": "leaf"
                    },
                    {
                        "title": "CITES (Import)",
                        "path": "/database/views/cites/import",
                        "icon": "leaf"
                    },
                    {
                        "title": "Gratuitous Permit",
                        "path": "/database/views/gratuitous_permit",
                        "icon": "leaf"
                    },
                    {
                        "title": "Wildlife Collector's Permit",
                        "path": "/database/views/wcp",
                        "icon": "leaf"
                    }
                ]
            },
            {
                "controller":"<script src='app/profile_management/controller.js'></script>",
                "icon":"files-o",
                "title":"Profile Management",
                "menu" : [
                    {
                        "title": "Profiles",
                        "path": "/profile_management/list",
                        "icon": "list"
                    },
                    {
                        "title": "Links",
                        "path": "/profile_management/links",
                        "icon": "group"
                    }
                ]
            },
            {
                "controller":"<script src='app/records/queries/incoming/controller.js'></script>",
                "icon":"files-o",
                "title":"Communications",
                "menu" : [
                    {
                        "title": "Create",
                        "path": "/records/queries/incoming/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/records/queries/incoming/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/records/queries/incoming/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/operation/controller.js'></script>",
                "icon":"files-o",
                "title":"Operation",
                "menu" : [
                    {
                        "title": "Create",
                        "path": "/operations/operation/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/operation/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/operation/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/images/controller.js'></script><script src='app/operations/images/captured_from_tracking/controller.js'></script>",
                "icon":"file-photo-o",
                "title":"Image Gallery",
                "menu" : [
                    {
                        "title": "Captured Images from Tracking",
                        "path": "/operations/images/captured_from_tracking",
                        "icon": "magic"
                    }
                ]
            }
        ],
            "name":"Admin",
            "phone":"+639486601717"
        }
`);
authenticateStaff();
