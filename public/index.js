'use strict';
var qr_address = "https://pcsd-brain-systems.web.app/qr/";
var api_address = "https://brain.pcsd.gov.ph/api/";
// var cloud_function_api = "https://us-central1-pcsd-brain-systems.cloudfunctions.net/";
var cloud_function_api = "https://us-central1-pcsd-app.cloudfunctions.net/"; 
//angularjs main
var script_angular = `
    <script src="js/angular.min.js"></script>
    <script src="js/angular-route.js"></script>
    <script src="js/angular-animate.min.js"></script>
    <script src="js/angular-aria.min.js"></script>
    <script src="js/angular-messages.min.js"></script>
    <script src="js/angular-material.min.js"></script>
    <script src="js/ngStorage.min.js"></script>
    `;
//angularjs plugins
var script_ng_plugins = {
    ngTable : `<script src="js/ng-table.min.js"></script>`,
    fileUpload : `<script src="js/ng-file-upload-bower-12.2.13/ng-file-upload-shim.js"></script>
                    <script src="js/ng-file-upload-bower-12.2.13/ng-file-upload.min.js"></script>`,
    camera : `<script src="js/webcam.min.js"></script>
                <script src="js/ng-camera.js"></script>
                <script src="js/ng-image-crop/ng-img-crop.js"></script>`
};
//angularjs controllers
var scripts_controllers = {
    main : `<script src="app/app.js"></script>`,
    login : `<script src="app/login/controller.js"></script>`,
    incomplete : `<script src="app/completeProfile/controller.js"></script>`,
    validUser : `<script src="app/pages/profile/controller.js"></script>
                    <script src="app/pages/application/controller.js"></script>
                    <script src="app/pages/dashboard/controller.js"></script>
                    <script src="app/pages/single/controller.js"></script>`
};
var scripts_js_plugins = {
    particles : `<script src="plugins/particlesjs/js/particles.min.js"></script>
                <script src="plugins/particlesjs/js/app.js"></script>`,
    moment : `<script src="plugins/momentjs/moment.js"></script>`,
    qr : `<script src="js/qrcode.min.js"></script>`,
    export : `<script src="js/export/shim.min.js"></script>
                <script src="js/export/xlsx.core.min.js"></script>
                <script src="js/export/xls.core.min.js"></script>
                <script src="js/export/Blob.js"></script>
                <script src="js/export/FileSaver.js"></script>`
}
//scripts for login user
let loginPage = scripts_js_plugins.particles + script_angular + script_ng_plugins.ngTable 
    + scripts_controllers.main + scripts_controllers.login + scripts_controllers.incomplete;
//scripts for dashboard
let userPage = script_angular + script_ng_plugins.ngTable + scripts_js_plugins.moment 
    + script_ng_plugins.fileUpload + script_ng_plugins.camera + scripts_js_plugins.qr 
    + scripts_js_plugins.export + scripts_controllers.main  + scripts_controllers.validUser;


async function authenticateUser(){
    var v = localData.get('current_view'); 
    if(v == undefined) 
        localData.set('current_view','app/loading.html');
    if(v == 'app/completeProfile/view.html'){
        if( localData.get('authUser') == undefined){
            localData.remove('current_view');
            location.reload();
        }
    }
    
    document.write(loginPage);
    
    await firebase.auth().onAuthStateChanged( async (user)=> {
        
        if (user) {
            localData.set('authUser',user.uid);
            let x = await is_user_exists_from_profile(user.uid);
            if(!x){
                //if user exist but no profile yet'
                let completeView = 'app/completeProfile/view.html';
                if(v != completeView){
                    localData.set('current_view',completeView);
                    location.reload();
                }else {
                    $('#particles-js').hide();
                }
                
            }else {
                let dashView = 'app/templates/main.html';
                localData.set('profileId',user.uid);
                if(v != dashView){
                    localData.set('current_view',dashView);
                    location.reload();
                }
            }
        }else {
            let loginView = 'app/login/view.html';
            if(v != loginView){
                localData.set('current_view',loginView);
                location.reload();
            }
        }
    });
}
//run
// localData.set('profileId', '12Ut9pTSZcgXOQPc2dkRYXYQv6t1')
if(localData.get('profileId')){
    //load dashboard
    document.write(userPage);
    //check for logout activity
    localData.set('current_view','app/templates/main.html');
    firebase.auth().onAuthStateChanged( async (user)=> {
        if (!user) {
            localData.remove('ngStorage-brain_app_user');
            localData.remove('current_view');
            localData.remove('authUser');
            localData.remove('profileId');
            localData.set('brainStarted',false);
            location.reload();
        }
    });
}else {
    authenticateUser();
}
