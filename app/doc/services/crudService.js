myAppModule.
service('$crudService', function(){

    this.getItems = (collection, objectConverter) => {
        // var items = []
        if(!objectConverter)
            objectConverter = defaultObjectConverter;
        
        let promise = new Promise((resolve, reject) => {
            collection.onSnapshot(snapShot => {
                let items = snapShot.docs.map(documentSnapshot =>{
                    let item = objectConverter(documentSnapshot);

                    return item;
                });

                resolve(items);
            });
        });

        return promise;
    }

    this.getItem = (id, collection, objectConverter) => {
        if(!objectConverter)
            objectConverter = defaultObjectConverter;
        
        let promise = new Promise((resolve, reject) => {
            collection.doc(id).onSnapshot(documentSnapshot => {
                let item = objectConverter(documentSnapshot);
                resolve(item);
            });
        },
        error => {
            reject(error);
        });

        return promise;
    }

    function defaultObjectConverter(documentSnapshot){
        let item =  documentSnapshot.data();
        item.id = documentSnapshot.id;

        return item;
    }

    this.addItem = (itemToAdd, collection) => {
        let promise = new Promise((resolve, reject) => {
            collection.add(itemToAdd).then(result => {
                resolve();
            },
            error => {
                reject(error);
            });
        })
        return promise;
    }

    this.updateItem = (item, collection) => {
        let promise = new Promise((resolve, reject) => {
            collection.doc(item.id).update(item).then(result =>{
                resolve();
            },
            error => { reject(error); });
        })

        return promise;
    }

    this.updateCounterFor = (item, document) => {
        let promise = new Promise((resolve, reject) => {
        console.log(item);
        
        var counter = {};
            if(item.Year && item.Month) {
                counter["yearlyCount.total"] = firebase.firestore.FieldValue.increment(1);
                counter[`yearlyCount.${item.Year}.total`] = firebase.firestore.FieldValue.increment(1);
                counter[`yearlyCount.${item.Year}.${item.Month}`] = firebase.firestore.FieldValue.increment(1); 
            }

            if(item.Municipality)
            {
                counter[`municipalityCount.${item.Municipality}`] = firebase.firestore.FieldValue.increment(1);                
            }

            if(Object.keys(counter).length)
            {
                document.update(counter).
                then(result => {

                },
                error => {
                    console.log(error);
                });
            }

        });

        return promise;
    }
})