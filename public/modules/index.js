'use strict';
// var cloud_function_api = "https://us-central1-pcsd-brain-systems.cloudfunctions.net/";
var cloud_function_api = "https://us-central1-pcsd-app.cloudfunctions.net/"; 
//angularjs main
var script_angular = `<script src="/js/angular.min.js"></script>
    <script src="/js/angular-route.js"></script>
    <script src="/js/angular-animate.min.js"></script>
    <script src="/js/angular-aria.min.js"></script>
    <script src="/js/angular-messages.min.js"></script>
    <script src="/js/angular-material.min.js"></script>
    <script src="/js/ngStorage.min.js"></script>`;
//angularjs plugins
var script_ng_plugins = {
    ngTable : `<script src="/js/ng-table.min.js"></script>`,
    fileUpload : `<script src="/js/ng-file-upload-bower-12.2.13/ng-file-upload-shim.js"></script>
                    <script src="/js/ng-file-upload-bower-12.2.13/ng-file-upload.min.js"></script>`,
    camera : `<script src="/js/webcam.min.js"></script>
                <script src="/js/ng-camera.js"></script>
                <script src="/js/ng-image-crop/ng-img-crop.js"></script>`
};
//angularjs controllers
var scripts_controllers = {
    main : `<script src="app/app.js"></script>`,
    profile : `<script src="app/profile_management/controller.js"></script>`
};
var scripts_js_plugins = {
    particles : `<script src="/plugins/particlesjs/js/particles.min.js"></script>
                <script src="/plugins/particlesjs/js/app.js"></script>`,
    moment : `<script src="/plugins/momentjs/moment.js"></script>`,
    qr : `<script src="/js/qrcode.min.js"></script>`,
    export : `<script src="/js/export/shim.min.js"></script>
                <script src="/js/export/xlsx.core.min.js"></script>
                <script src="/js/export/xls.core.min.js"></script>
                <script src="/js/export/Blob.js"></script>
                <script src="/js/export/FileSaver.js"></script>`
}

//scripts for login user
let profileModule = script_angular + scripts_controllers.main + scripts_controllers.profile + script_ng_plugins.ngTable;
let v = localData.get('current_view');
    if(!v){
        localData.set(v);
    }
// localData.set('current_view', 'app/profile_management/list.html');
document.write(profileModule);