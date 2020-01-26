myAppModule.controller('captured_images_controller', function($scope){

}).
service('captured_images_services', function(){
    this.getImages = (dataSourceName, month, year) => {
        return new Promise((resolve, reject) => {
            var start = new Date(year, month - 1, 1);
            var end = new Date(year, month, 0);
            db.collection(dataSourceName).
            where('time', '>=', start).
            where('time', '<=', end).
            onSnapshot(snapshot => {
                var images = snapshot.docs.map(document => {
                    var image = document.data();
                    image.id = document.id;
                });

                resolve(images);
            })
        });
    }

})