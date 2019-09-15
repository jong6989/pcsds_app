'use strict';
var base_url = "/";
var qr_address = "https://pcsd-brain-systems.web.app/qr/";
var api_address = "https://brain.pcsd.gov.ph/api/";
// var cloud_function_api = "https://us-central1-pcsd-brain-systems.cloudfunctions.net/";
var cloud_function_api = "https://us-central1-pcsd-app.cloudfunctions.net/"; 

document.write(
    `
        <base href="${base_url}">
        <script src="plugins/jquery/jquery.min.js"></script>
        <script src="plugins/bootstrap/4.1.1/bootstrap.min.js"></script>
        
        <script src="js/angular.min.js"></script>
        <script src="js/angular-route.js"></script>
        <script src="js/angular-animate.min.js"></script>
        <script src="js/angular-aria.min.js"></script>
        <script src="js/angular-messages.min.js"></script>
        <script src="js/angular-material.min.js"></script>
        <script src="js/ngStorage.min.js"></script>
        <script src="js/ng-table.min.js"></script>

        <script src="app/app.js"></script>
        <script src="app/login/controller.js"></script>
    `
)

if(window.localStorage["ngStorage-brain_app_user"] !== undefined){
    document.write(
        `
        <script src="js/firebase/firebase-app.js"></script>
        <script src="js/firebase/firebase-auth.js"></script>
        <script src="js/firebase/firebase-firestore.js"></script>
        <script src="js/firebase/init-firebase.js"></script>

        <script src="plugins/momentjs/moment.js"></script>

        <script src="js/ng-file-upload-bower-12.2.13/ng-file-upload-shim.js"></script>
        <script src="js/ng-file-upload-bower-12.2.13/ng-file-upload.min.js"></script>
        <script src="js/webcam.min.js"></script>
        <script src="js/ng-camera.js"></script>
        <script src="js/ng-image-crop/ng-img-crop.js"></script>

        <script src="app/pages/profile/controller.js"></script>
        <script src="app/pages/application/controller.js"></script>
        <script src="app/pages/dashboard/controller.js"></script>
        <script src="app/pages/single/controller.js"></script>
        
        <script src="js/export/shim.min.js"></script>
        <script src="js/export/xlsx.core.min.js"></script>
        <script src="js/export/xls.core.min.js"></script>
        <script src="js/export/Blob.js"></script>
        <script src="js/export/FileSaver.js"></script>

        <script src="js/qrcode.min.js"></script>
        
        `
    )
}else{
    document.write(`
        <script src="plugins/particlesjs/js/particles.min.js"></script>
        <script src="plugins/particlesjs/js/app.js"></script>
    `)
}