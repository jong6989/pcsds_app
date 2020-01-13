var printModule = angular.module('print_module', []);
printModule.
controller('PrintController', function($scope) {
    var url = new URL(location.href);
    var templateToPrint = url.searchParams.get('view');
    if(templateToPrint){
        $scope.templateToPrint = templateToPrint.replace('./', '');
    }
})

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
