myAppModule.controller('captured_images_from_tracking_controller', function (
    $scope,
    $window,
    tracking_images_service) {

    $scope.loadMonths = () => {
        var dateNow = new Date();
        var end = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate());
        var timeSixMonthsAgo = end.getTime() - 1.314e+10;
        var start = new Date(timeSixMonthsAgo);
        var millisecondsPerMonth = 2.628e+9;
        var months = [];
        for (var i = end.getTime(); i >= start.getTime(); i -= millisecondsPerMonth) {
            var date = new Date(i);
            months.push(getMonth(date));
        }
        $scope.months = months;
        loadStaffWithCapturedImages(months);
    }

    function getMonth(date) {
        return {
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            MMMMYYYY: `${moment(date).format('MMMM')} ${date.getFullYear()}`
        }
    }

    $scope.capturedImages = {};
    var loadStaffWithCapturedImages = (months) => {
        $scope.capturedImages = {};
        months.forEach(month => {
            tracking_images_service.
                getStaffWithCapturedImages(month.month, month.year).
                then(staff => {
                    $scope.capturedImages[month.MMMMYYYY] = {
                        staff: staff
                    };
                    $scope.$apply();
                })
        })
    }

    $scope.loadImages = (staff, month, year) => {
        $scope.images = [];
        setMonth(month, year);
        tracking_images_service.
            getCapturedImages(staff, month, year).
            then(images => {
                $scope.images = images;
                $scope.staff = staff;
                $scope.$apply();
            })
    }

    $scope.month = {};
    function setMonth(month, year) {
        var date = new Date(year, month - 1, 1);
        $scope.month = getMonth(date);
    }

    $scope.updateImage = (imageIndex) => {
        $scope.imageToUpdate = $scope.images[imageIndex];
        $scope.showPrerenderedDialog(null, 'windowImage');
    }

    $scope.currentImageIndex = -1;
    $scope.openImage = function (index) {
        setCurrentImage(index);
        $scope.showPrerenderedDialog(null, 'windowImage');
    }

    function setCurrentImage(index) {
        $scope.imageToUpdate = $scope.images[index];
        $scope.imageUrl = $scope.imageToUpdate.url;
        $scope.imageDescription = $scope.imageToUpdate.description;
        $scope.imageClass = $scope.imageToUpdate.classification || '';
        $scope.longitude = $scope.imageToUpdate.longitude;
        $scope.latitude = $scope.imageToUpdate.latitude;
        $scope.dateAndTimeTaken = $scope.to_date($scope.imageToUpdate.time);
        $scope.currentImageIndex = index;
    }

    $scope.nextImage = () => {
        setCurrentImage(($scope.currentImageIndex + 1) % $scope.images.length)
    }

    $scope.previousImage = () => {
        var previousIndex = $scope.currentImageIndex == 0 ?
            $scope.images.length - 1 :
            $scope.currentImageIndex - 1;
        setCurrentImage(previousIndex);
    }

    $scope.back = () => {
        $scope.staff = null;
    }

    $scope.save = (imageToUpdate) => {
        $scope.isBusy = true;

        imageToUpdate.id = $scope.imageToUpdate.id;
        tracking_images_service.
            update(imageToUpdate).
            then(result => {
                $scope.isBusy = false;
                tracking_images_service.
                    addClassification(imageToUpdate.classification).
                    then(classification => {

                    })
            })
    }

    $scope.delete = (imageToDelete) => {
        $scope.isBusy = true;

        Swal.fire({
            title: 'Are you sure you want to delete this item?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((response) => {
            if (response.value) {
                tracking_images_service.
                    delete(imageToDelete).
                    then(result => {
                        $scope.isBusy = false;
                    })
            }
        })

    }

    $scope.classifications = [];
    $scope.loadClassifications = () => {
        tracking_images_service.
            getClassifications().
            then(classifications => {
                $scope.classifications = classifications;
                $scope.$apply();
            })
    }
    // $scope.staff =  { uid: '12Ut9pTSZcgXOQPc2dkRYXYQv6t1', name: 'Juan dela Cruz' };
    // $scope.loadImages($scope.staff, 1, 2020);
    $scope.images = [
        { id: 0, url: '/images/brain_logo.png' }
    ]

    $scope.loadMap = () => {
        var image = JSON.parse(localData.get('image'));
        new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        })
            .setLngLat([image.longitude, image.latitude])
            .setHTML(`<img src=${image.url} style='width: 100px; height:150px;object-fit:contain'>`)
            .addTo($scope.map);
        $scope.map.flyTo({ center: [image.longitude, image.latitude], zoom: 15});
        // localData.remove('image');
    }

    $scope.viewOnMap = (image) => {
        localData.set('image', JSON.stringify(image));
        $window.open('#!/operations/images/captured_from_tracking/map', '_blank');
        $scope.$apply();
    }

    // localData.set('image', JSON.stringify($scope.images[0]));
}).service('tracking_images_service', function () {
        var collection = db.collection('ecan_app_images');

        this.update = (updatedImage) => {
            return new Promise((resolve, reject) => {
                collection.
                    doc(updatedImage.id).
                    update(updatedImage).
                    then(result => {
                        resolve(updatedImage);
                    })
            })
        }

        this.delete = (imageToDelete) => {
            return new Promise((resolve, reject) => {
                collection.
                    doc(imageToDelete.id).
                    update({ is_deleted: true }).
                    then(result => {
                        resolve(result);
                    })
            })
        }
        this.getImagesBetween = (startDate, endDate) => {
            return new Promise((resolve, reject) => {
                collection.
                    where('time', '>=', startDate.getTime()).
                    where('time', '<=', endDate.getTime()).
                    onSnapshot(snapshot => {
                        var images = snapshot.docs.map(document => {
                            var image = document.data();
                            image.id = document.id;
                            return image;
                        });
                        resolve(images);
                    })
            })
        }

        this.getImages = (month, year) => {
            return new Promise((resolve, reject) => {
                var start = new Date(year, month - 1, 1);
                var end = new Date(year, month, 0);
                collection.
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

        this.getStaffWithCapturedImages = (month, year) => {
            return new Promise((resolve, reject) => {
                var start = new Date(year, month - 1, 1);
                var end = new Date(year, month, 0);
                collection.
                    where('time', '>=', start.getTime()).
                    where('time', '<=', end.getTime()).
                    where('uploaded', '==', true).
                    where('is_deleted', '==', false).
                    onSnapshot(snapshot => {
                        var uids = snapshot.docs.map(document => {
                            var image = document.data();

                            return image.uid;
                        });

                        uids = new Set(uids);
                        var promises = [];
                        uids.forEach(uid => {
                            if (uid) {
                                var promise = this.getStaff(uid);
                                promises.push(promise);
                            }
                        });

                        Promise.all(promises).then(staff => {
                            resolve(staff);
                        });
                    })
            })
        }

        this.getStaff = (uid) => {
            return new Promise((resolve, reject) => {
                db.collection('staffs').
                    where('staff_id', '==', uid).
                    onSnapshot(snapshot => {
                        var staff = null;
                        var document = snapshot.docs ? snapshot.docs[0] : null;
                        if (document) {
                            staff = document.data();
                            staff.id = document.id;
                        }

                        resolve(staff);
                    })
            })
        }

        this.getCapturedImages = (staff, month, year) => {
            return new Promise((resolve, reject) => {
                var start = new Date(year, month - 1, 1);
                var end = new Date(year, month, 0);
                collection.
                    where('staff_id', '==', staff.uid).
                    where('time', '>=', start.getTime()).
                    where('time', '<=', end.getTime()).
                    where('uploaded', '==', true).
                    where('is_deleted', '==', false).
                    onSnapshot(snapshot => {
                        var images = snapshot.docs.map(document => {
                            var image = document.data();
                            image.id = document.id;
                            // image.url = '/images/brain_logo.png';
                            return image;
                        });
                        resolve(images);
                    })
            })
        }

        this.addClassification = (classification) => {
            return new Promise((resolve, reject) => {
                db.
                    collection('ecan_app_image_classifications').
                    where('name', '==', classification).
                    onSnapshot(snapshot => {
                        if (snapshot.docs.length == 0) {
                            db.
                                collection('ecan_app_image_classifications').
                                add({ name: classification }).
                                then(result => {
                                    resolve(classification);
                                });
                        } else
                            resolve(classification)
                    })

            })
        }

        this.getClassifications = () => {
            return new Promise((resolve, reject) => {
                db.
                    collection('ecan_app_image_classifications').
                    onSnapshot(snapshot => {
                        var classifications = snapshot.docs.map(document => {
                            return document.data();
                        });

                        resolve(classifications);
                    })
            })
        }
    }).directive('ngImageGalleryExtended', ['$rootScope', '$timeout', '$q', 'ngImageGalleryOpts',
        function ($rootScope, $timeout, $q, ngImageGalleryOpts) {
            return {
                replace: true,
                transclude: false,
                restrict: 'AE',
                scope: {
                    images: '=',		// []
                    methods: '=?',		// {}
                    conf: '=?',		// {}

                    thumbnails: '=?',		// true|false
                    thumbSize: '=?', 		// px
                    thumbLimit: '=?', 		// px
                    inline: '=?',		// true|false
                    bubbles: '=?',		// true|false
                    bubbleSize: '=?',		// px
                    imgBubbles: '=?',		// true|false
                    bgClose: '=?',		// true|false
                    piracy: '=?',		// true|false
                    imgAnim: '@?',		// {name}
                    textValues: '=?',		// {}

                    onOpen: '&?',		// function
                    onClose: '&?',		// function,
                    onDelete: '&?',
                    onEdit: '&?',
                    openImage: '&?'
                },
                template: '<div class="ng-image-gallery img-move-dir-{{_imgMoveDirection}}" ng-class="{inline:inline}" ng-hide="images.length == 0">' +

                    // Thumbnails container
                    //  Hide for inline gallery
                    '<div ng-if="thumbnails && !inline" class="ng-image-gallery-thumbnails">' +
                    '<div class="thumb" ng-repeat="image in images track by image.id" ng-if="thumbLimit ? $index < thumbLimit : true" ng-click="openImage($index);" show-image-async="{{image.thumbUrl || image.url}}" title="{{image.title}}" async-kind="thumb" ng-style="{\'width\' : thumbSize+\'px\', \'height\' : thumbSize+\'px\'}">' +
                    '<div class="loader"></div>' +
                    '</div>' +
                    '</div>' +

                    // Modal container
                    // (inline container for inline modal)
                    '<div class="ng-image-gallery-modal" ng-if="opened" ng-cloak>' +

                    // Gallery backdrop container
                    // (hide for inline gallery)
                    '<div class="ng-image-gallery-backdrop" ng-if="!inline"></div>' +

                    // Gallery contents container
                    // (hide when image is loading)
                    '<div class="ng-image-gallery-content" ng-show="!imgLoading" ng-click="backgroundClose($event);">' +

                    // actions icons container
                    '<div class="actions-icons-container">' +
                    // Delete image icon
                    '<div class="delete-img" ng-repeat="image in images track by image.id" ng-if="_activeImg == image && image.deletable" title="{{textValues.deleteButtonTitle}}" ng-click="_deleteImg(image)"></div>' +

                    // Edit image icon
                    '<div class="edit-img" ng-repeat="image in images track by image.id" ng-if="_activeImg == image && image.editable" title="{{textValues.editButtonTitle}}" ng-click="_editImg(image)"></div>' +
                    '</div>' +

                    // control icons container
                    '<div class="control-icons-container">' +
                    // External link icon
                    '<a class="ext-url" ng-repeat="image in images track by image.id" ng-if="_activeImg == image && image.extUrl" href="{{image.extUrl}}" target="_blank" title="{{textValues.externalLinkButtonTitle}}"></a>' +

                    // Close Icon (hidden in inline gallery)
                    '<div class="close" ng-click="methods.close();" ng-if="!inline"  title="{{textValues.closeButtonTitle}}"></div>' +
                    '</div>' +


                    // Galleria container
                    '<div class="galleria" layout="row">' +

                    // Images container
                    '<div class="galleria-images img-anim-{{imgAnim}} img-move-dir-{{_imgMoveDirection}}">' +
                    '<img class="galleria-image" ng-right-click ng-repeat="image in images track by image.id" ng-if="_activeImg == image" ng-src="{{image.url}}" ondragstart="return false;" ng-attr-alt="{{image.alt || undefined}}"/>' +
                    '</div>' +

                    // Image description container
                    '<div class="galleria-title-description-wrapper">' +
                    '<div ng-repeat="image in images track by image.id" ng-if="(image.title || image.description) && (_activeImg == image)">' +
                    '<div class="title" ng-if="image.title" ng-bind-html="image.title | ngImageGalleryTrust"></div>' +
                    '<div class="description" ng-if="image.description" ng-bind-html="image.description | ngImageGalleryTrust"></div>' +
                    '</div>' +
                    '</div>' +
                    '</div>' +

                    '</div>' +

                    // Loading animation overlay container
                    // (show when image is loading)
                    '<div class="ng-image-gallery-loader" ng-show="imgLoading">' +
                    '<div class="spinner">' +
                    '<div class="rect1"></div>' +
                    '<div class="rect2"></div>' +
                    '<div class="rect3"></div>' +
                    '<div class="rect4"></div>' +
                    '<div class="rect5"></div>' +
                    '</div>' +
                    '</div>' +

                    // (show when image cannot be loaded)
                    '<div class="ng-image-gallery-errorplaceholder" ng-show="imgError">' +
                    '<div class="ng-image-gallery-error-placeholder" ng-bind-html="textValues.imageLoadErrorMsg | ngImageGalleryTrust"></div>' +
                    '</div>' +
                    '</div>' +
                    '</div>',

                link: {
                    pre: function (scope, elem, attr) {

                        /*
                         *	Operational functions
                        **/

                        // Show gallery loader
                        scope._showLoader = function () {
                            scope.imgLoading = true;
                        }

                        // Hide gallery loader
                        scope._hideLoader = function () {
                            scope.imgLoading = false;
                        }

                        // Image load complete promise
                        scope._loadImg = function (imgObj) {

                            // Return rejected promise
                            // if not image object received
                            if (!imgObj) return $q.reject();

                            var deferred = $q.defer();

                            // Show loader
                            if (!imgObj.hasOwnProperty('cached')) scope._showLoader();

                            // Process image
                            var img = new Image();
                            img.src = imgObj.url;
                            img.onload = function () {
                                // Hide loader
                                if (!imgObj.hasOwnProperty('cached')) scope._hideLoader();

                                // Cache image
                                if (!imgObj.hasOwnProperty('cached')) imgObj.cached = true;

                                deferred.resolve(imgObj);
                            }
                            img.onerror = function () {
                                if (!imgObj.hasOwnProperty('cached')) scope._hideLoader();

                                deferred.reject('Error when loading img');
                            }

                            return deferred.promise;
                        }

                        scope._setActiveImg = function (imgObj) {
                            // Get images move direction
                            if (
                                scope.images.indexOf(scope._activeImg) - scope.images.indexOf(imgObj) == (scope.images.length - 1) ||
                                (
                                    scope.images.indexOf(scope._activeImg) - scope.images.indexOf(imgObj) <= 0 &&
                                    scope.images.indexOf(scope._activeImg) - scope.images.indexOf(imgObj) != -(scope.images.length - 1)
                                )

                            ) {
                                scope._imgMoveDirection = 'forward';
                            }
                            else {
                                scope._imgMoveDirection = 'backward';
                            }

                            // Load image
                            scope._loadImg(imgObj).then(function (imgObj) {
                                scope._activeImg = imgObj;
                                scope._activeImageIndex = scope.images.indexOf(imgObj);
                                scope.imgError = false;
                            }, function () {
                                scope._activeImg = null;
                                scope._activeImageIndex = scope.images.indexOf(imgObj);
                                scope.imgError = true;
                            })
                                ;
                        }

                        scope._safeApply = function (fn) {
                            var phase = this.$root.$$phase;
                            if (phase == '$apply' || phase == '$digest') {
                                if (fn && (typeof (fn) === 'function')) {
                                    fn();
                                }
                            } else {
                                this.$apply(fn);
                            }
                        };

                        scope._deleteImg = function (img) {
                            var _deleteImgCallback = function () {
                                var index = scope.images.indexOf(img);
                                scope.images.splice(index, 1);
                                scope._activeImageIndex = 0;

                                /**/
                            }

                            scope.onDelete({ img: img, cb: _deleteImgCallback });
                        }

                        scope._editImg = function (img) {
                            if (!scope.inline) scope.methods.close();

                            scope.onEdit({ img: img });
                        }


                        /***************************************************/


                        /*
                         *	Gallery settings
                        **/

                        // Modify scope models
                        scope.images = (scope.images != undefined) ? scope.images : [];
                        scope.methods = (scope.methods != undefined) ? scope.methods : {};
                        scope.conf = (scope.conf != undefined) ? scope.conf : {};

                        // setting options
                        scope.$watchCollection('conf', function (conf) {
                            scope.thumbnails = (conf.thumbnails != undefined) ? conf.thumbnails : (scope.thumbnails != undefined) ? scope.thumbnails : ngImageGalleryOpts.thumbnails;
                            scope.thumbSize = (conf.thumbSize != undefined) ? conf.thumbSize : (scope.thumbSize != undefined) ? scope.thumbSize : ngImageGalleryOpts.thumbSize;
                            scope.thumbLimit = (conf.thumbLimit != undefined) ? conf.thumbLimit : (scope.thumbLimit != undefined) ? scope.thumbLimit : ngImageGalleryOpts.thumbLimit;
                            scope.inline = (conf.inline != undefined) ? conf.inline : (scope.inline != undefined) ? scope.inline : ngImageGalleryOpts.inline;
                            scope.bubbles = (conf.bubbles != undefined) ? conf.bubbles : (scope.bubbles != undefined) ? scope.bubbles : ngImageGalleryOpts.bubbles;
                            scope.bubbleSize = (conf.bubbleSize != undefined) ? conf.bubbleSize : (scope.bubbleSize != undefined) ? scope.bubbleSize : ngImageGalleryOpts.bubbleSize;
                            scope.imgBubbles = (conf.imgBubbles != undefined) ? conf.imgBubbles : (scope.imgBubbles != undefined) ? scope.imgBubbles : ngImageGalleryOpts.imgBubbles;
                            scope.bgClose = (conf.bgClose != undefined) ? conf.bgClose : (scope.bgClose != undefined) ? scope.bgClose : ngImageGalleryOpts.bgClose;
                            scope.piracy = (conf.piracy != undefined) ? conf.piracy : (scope.piracy != undefined) ? scope.piracy : ngImageGalleryOpts.piracy;
                            scope.imgAnim = (conf.imgAnim != undefined) ? conf.imgAnim : (scope.imgAnim != undefined) ? scope.imgAnim : ngImageGalleryOpts.imgAnim;
                            scope.textValues = (conf.textValues != undefined) ? conf.textValues : (scope.textValues != undefined) ? scope.textValues : ngImageGalleryOpts.textValues;
                        });

                        scope.onOpen = (scope.onOpen != undefined) ? scope.onOpen : angular.noop;
                        scope.onClose = (scope.onClose != undefined) ? scope.onClose : angular.noop;
                        scope.onDelete = (scope.onDelete != undefined) ? scope.onDelete : angular.noop;
                        scope.onEdit = (scope.onEdit != undefined) ? scope.onEdit : angular.noop;

                        // If images populate dynamically, reset gallery
                        var imagesFirstWatch = true;
                        scope.$watchCollection('images', function () {
                            if (imagesFirstWatch) {
                                imagesFirstWatch = false;
                            }
                            else if (scope.images.length) {
                                scope._setActiveImg(scope.images[scope._activeImageIndex || 0]);
                            }
                        });

                        // Watch index of visible/active image
                        // If index changes, make sure to load/change image
                        var activeImageIndexFirstWatch = true;
                        scope.$watch('_activeImageIndex', function (newImgIndex) {
                            if (activeImageIndexFirstWatch) {
                                activeImageIndexFirstWatch = false;
                            }
                            else if (scope.images.length) {
                                scope._setActiveImg(
                                    scope.images[newImgIndex]
                                );
                            }
                        });

                        // Open modal automatically if inline
                        scope.$watch('inline', function () {
                            $timeout(function () {
                                if (scope.inline) scope.methods.open();
                            });
                        });

                        /***************************************************/


                        /*
                         *	Methods
                        **/

                        // Open gallery modal
                        // scope.methods.open = function(imgIndex){
                        //     // Open modal from an index if one passed
                        //     scope._activeImageIndex = (imgIndex) ? imgIndex : 0;

                        //     scope.opened = true;

                        //     // set overflow hidden to body
                        //     if(!scope.inline) angular.element(document.body).addClass('body-overflow-hidden');

                        //     // call open event after transition
                        //     $timeout(function(){
                        //         scope.onOpen();
                        //     }, 300);
                        // }

                        scope.openImage = function (imageIndex) {
                            if (scope.onOpen)
                                scope.onOpen({ index: imageIndex });
                        }
                        scope.methods.open = function (imgIndex) {
                            // Open modal from an index if one passed
                            scope._activeImageIndex = (imgIndex) ? imgIndex : 0;

                            scope.onOpen(imgIndex);
                        }

                        // Close gallery modal
                        scope.methods.close = function () {
                            scope.opened = false; // Model closed

                            // set overflow hidden to body
                            angular.element(document.body).removeClass('body-overflow-hidden');

                            // call close event after transition
                            $timeout(function () {
                                scope.onClose();
                                scope._activeImageIndex = 0; // Reset index
                            }, 300);
                        }

                        // Change image to next
                        scope.methods.next = function () {
                            if (scope._activeImageIndex == (scope.images.length - 1)) {
                                scope._activeImageIndex = 0;
                            }
                            else {
                                scope._activeImageIndex = scope._activeImageIndex + 1;
                            }
                        }

                        // Change image to prev
                        scope.methods.prev = function () {
                            if (scope._activeImageIndex == 0) {
                                scope._activeImageIndex = scope.images.length - 1;
                            }
                            else {
                                scope._activeImageIndex--;
                            }
                        }


                        // Close gallery on background click
                        scope.backgroundClose = function (e) {
                            if (!scope.bgClose || scope.inline) return;

                            var noCloseClasses = [
                                'galleria-image',
                                'destroy-icons-container',
                                'ext-url',
                                'close',
                                'next',
                                'prev',
                                'galleria-bubble'
                            ];

                            // check if clicked element has a class that
                            // belongs to `noCloseClasses`
                            for (var i = 0; i < e.target.classList.length; i++) {
                                if (noCloseClasses.indexOf(e.target.classList[i]) != -1) {
                                    break;
                                }
                                else {
                                    scope.methods.close();
                                }
                            }
                        }


                        /***************************************************/


                        /*
                         *	User interactions
                        **/

                        // Key events
                        angular.element(document).bind('keyup', function (event) {
                            // If inline modal, do not interact
                            if (scope.inline) return;

                            if (event.which == keys.right || event.which == keys.enter) {
                                $timeout(function () {
                                    scope.methods.next();
                                });
                            }
                            else if (event.which == keys.left) {
                                $timeout(function () {
                                    scope.methods.prev();
                                });
                            }
                            else if (event.which == keys.esc) {
                                $timeout(function () {
                                    scope.methods.close();
                                });
                            }
                        });

                        // Swipe events
                        if (window.Hammer) {
                            var hammerElem = new Hammer(elem[0]);
                            hammerElem.on('swiperight', function (ev) {
                                $timeout(function () {
                                    scope.methods.prev();
                                });
                            });
                            hammerElem.on('swipeleft', function (ev) {
                                $timeout(function () {
                                    scope.methods.next();
                                });
                            });
                            hammerElem.on('doubletap', function (ev) {
                                if (scope.inline) return;

                                $timeout(function () {
                                    scope.methods.close();
                                });
                            });
                        };


                        /***********************************************************/


                        /*
                         *	Actions on angular events
                        **/

                        var removeClassFromDocumentBody = function () {
                            angular.element(document.body).removeClass('body-overflow-hidden');
                        };

                        $rootScope.$on('$stateChangeSuccess', removeClassFromDocumentBody);
                        $rootScope.$on('$routeChangeSuccess', removeClassFromDocumentBody);

                    }
                }
            }
        }])