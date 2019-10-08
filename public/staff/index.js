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
                let dashboardPage = script_ng_plugins.dashboard + script_angular  + scripts_controllers.main + controllers;
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
    {"designation":"admin","id":"+639486601717","last_seen":1570521763344,
        "menu":[
            {
                "controller":"<script src='app/account_management/controller.js'></script>",
                "functions":["create","update","assign_module","disable"],
                "icon":"trash",
                "path":"/account_management",
                "title":"Account Management"
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
                "path":"/database",
                "title":"Data Sets"
            }
        ],
            "name":"Admin",
            "phone":"+639486601717"
        }
`)
authenticateStaff();