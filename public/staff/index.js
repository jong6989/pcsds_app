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
        <script src="/plugins/ng-image-gallery/dist/ng-image-gallery.min.js"></script>
        <script src="/plugins/angular-uuid/angular-uuid.js"></script>
        <link href="/plugins/ng-image-gallery/dist/ng-image-gallery.min.css" rel="stylesheet"/>
    `;
//angularjs plugins
var script_ng_plugins = {
    dashboard : `
        <script src="/plugins/momentjs/moment.js"></script>
        <script src="/js/signature_pad.min.js"></script>
        <script src="/js/quill.js"></script>
        <script src="/js/tinymce.min.js"></script>
        <script src="/js/xlsx/xlsx.min.js"></script>
        <script src="/js/qrcode.min.js"></script>
        <script src="/plugins/dot-object.min.js"></script>
        <script src="/plugins/hammer.min.js"></script>
    `
};
//angularjs controllers 
var scripts_controllers = {
    main : `<script src="app/app.js"></script>`,
    login : `<script src="app/login/controller.js"></script>`,
    chainsaw_monitoring: '<script src="app/templates/templates/monitoring/controller.js"></script>'
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
    

    var account_id = localData.get('BRAIN_STAFF_ID');
    
    if(account_id){

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
    }
}

//debug user
localData.set('BRAIN_STAFF_ID','+639486601717');
localData.set('STAFF_ACCOUNT',`
    {
        "designation":"admin",
        "id":"+639486601717",
        "last_seen":1570521763344,
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
                        "title": "Enforcer",
                        "path": "/operations/mapping/enforcer",
                        "icon": "street-view"
                    },
                    {
                        "title": "Map",
                        "path": "/operations/mapping/map",
                        "icon": "map-marker"
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
                "controller":"<script src='app/operations/monitoring/controller.js'></script>",
                "icon":"align-right",
                "title":"Chainsaw Monitoring Report",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/operations/monitoring/chainsaw/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/monitoring/chainsaw/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/monitoring/chainsaw/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/monitoring/controller.js'></script>",
                "icon":"align-right",
                "title":"SEP Gravel and Sand Monitoring Report",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/operations/monitoring/gravel_and_sand/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/monitoring/gravel_and_sand/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/monitoring/gravel_and_sand/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/monitoring/controller.js'></script>",
                "icon":"align-right",
                "title":"Wildlife Special Use Permit (RFF) Monitoring Report",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/operations/monitoring/rff/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/monitoring/rff/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/monitoring/rff/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/monitoring/controller.js'></script>",
                "icon":"align-right",
                "title":"SEP (PCSD) Monitoring Report",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/operations/monitoring/sep/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/monitoring/sep/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/monitoring/sep/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/monitoring/controller.js'></script>",
                "icon":"align-right",
                "title":"Wildlife Special Use Permit (AO12) Monitoring Report",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/operations/monitoring/wsup_ao_12/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/monitoring/wsup_ao_12/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/monitoring/wsup_ao_12/list/single",
                        "icon": "align-justify"
                    }
                ]
            },
            {
                "controller":"<script src='app/operations/monitoring/controller.js'></script>",
                "icon":"align-right",
                "title":"Chainsaw Special Use Permit Monitoring Report",
                "menu": [
                    {
                        "title": "Create",
                        "path": "/operations/monitoring/sup/create",
                        "icon": "magic"
                    },
                    {
                        "title": "All",
                        "path": "/operations/monitoring/sup/list/all",
                        "icon": "align-justify"
                    },
                    {
                        "title": "My List",
                        "path": "/operations/monitoring/sup/list/single",
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
            }
        ],
            "name":"Admin",
            "phone":"+639486601717"
        }
`);
authenticateStaff();
