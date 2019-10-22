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
    `,
    camera : `<script src="/js/webcam.min.js"></script>
                <script src="/js/ng-camera.js"></script>
                <script src="/js/ng-image-crop/ng-img-crop.js"></script>`
};
//angularjs controllers 
var scripts_controllers = {
    main : `<script src="app/app.js"></script>`,
    login : `<script src="app/login/controller.js"></script>`
};
var scripts_js_plugins = {
    particles : `<script src="/plugins/particlesjs/js/particles.min.js"></script>
                <script src="/plugins/particlesjs/js/app.js"></script>`,
    fileUpload : `<script src="/js/ng-file-upload-bower-12.2.13/ng-file-upload-shim.js"></script>
                    <script src="/js/ng-file-upload-bower-12.2.13/ng-file-upload.min.js"></script>`,
    export : `<script src="/js/export/shim.min.js"></script>
                <script src="/js/export/xlsx.core.min.js"></script>
                <script src="/js/export/xls.core.min.js"></script>
                <script src="/js/export/Blob.js"></script>
                <script src="/js/export/FileSaver.js"></script>`,
    html2canvas: `<script src="/js/html2canvas/html2canvas.min.js"></script>`,
    dot_object: `<script src="/plugins/dot-object.min.js"></script>`,
    image_gallery: '<script src="/plugins/ng-image-gallery/dist/ng-image-gallery.min.js"></script>' +  
        '<script src="/plugins/hammer.min.js"></script>' +
        '<link href="/plugins/ng-image-gallery/dist/ng-image-gallery.min.css" rel="stylesheet"/>'
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
                    controllers +
                    script_ng_plugins.ngTable +
                    script_ng_plugins.camera + 
                    script_ng_plugins.fileUpload +
                    scripts_js_plugins.dot_object +
                    scripts_js_plugins.image_gallery;
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
                "controller":"<script src='app/account_management/controller.js'></script><script src='app/account_management/menus/controller.js'></script>",
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
                "controller":"<script src='app/applications/controller.js'></script>",
                "icon":"files-o",
                "path":"/applications",
                "title":"Online Application"
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
`)

    authenticateStaff();

    // var currentUrl = new URL(location.href);
    // var view = currentUrl.searchParams.get('view');
    // if(view){
    //     localData.set('staff_current_view', view);
    // }