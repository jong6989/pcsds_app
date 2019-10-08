
myAppModule.service('func', function($localStorage) {
    var func = {};

    func.updateDoc = (id,data,callBack) => {
        doc.db.collection(documents).doc(id).update(data).then(callBack);
    };

    //Drafts
    func.getMyDrafts = async () => {
        let res = await doc.db.collection(documents).where("status","==","draft").where("publisher","==",func.$scope.userId).get();
        let r = res.docs.map( doc => { let o = doc.data(); o.id = doc.id; return o; });
        return r;
    }

    func.getFilesTobeUploaded = async () => {
        let res =   await doc.db.collection(acc).doc(func.$scope.userId).collection(offlineFiles).where("uploaded","==",false).get();
        let d = res.docs.map( dx => { 
            let o = dx.data();
            o.id = dx.id;
            return o;
        });
        return d;
    };

    func.listenToAccountChange = (id,callback) => {
        doc.db.collection(acc).doc(id).onSnapshot( async (d) => {
            $localStorage.doc_user = d.data();
            let c = [];
            if(!d.empty && $localStorage.doc_user.agencies != undefined){
                await $localStorage.doc_user.agencies.map( async v => {
                    let a = await doc.db.collection(agencies).doc(v).get();
                    if(a.empty){
                        $localStorage.doc_user_agencies = [];
                        return {};
                    }else {
                        let b = a.data();
                        b.id = a.id;
                        c.push(b);
                        return b;
                    }
                });
            }
            
            $localStorage.doc_user_agencies = c;
            callback(d.data(),c);
        });
    };

    func.getAgencies = async (x,callback) => {
        await doc.db.collection(agencies).get().then((qs) => {
            let a = [];
            let b = [];
            qs.forEach(dx => {
                let c = dx.data(); c.id = dx.id;
                if(x != undefined) {
                    if(x.agencies !== undefined){
                        x.agencies.forEach(agc => {
                            if(dx.id == agc){
                                a.push(c);
                            }else {
                                b.push(c);
                            }
                        });
                    }else {
                        b.push(c);
                    }
                }else {
                    b.push(c);
                }
            });
            callback(a,b);
        });
    };

    func.checkDraft = async (callback) => {
        $localStorage.myDrafts = await func.getMyDrafts();
        if($localStorage.myDrafts.length > 0) {
            $localStorage.currentItem = func.$scope.myDrafts[0];
            func.$scope.createdDate = $localStorage.currentItem.created;
            func.$scope.pdate = $localStorage.currentItem.published;
        }else {
            $localStorage.currentItem = null;
        }
        callback($localStorage.myDrafts, $localStorage.currentItem);
    };

    func.refreshDocItem = (id,callback) => {
        doc.db.collection(documents).doc(id).get().then(dx => {
            let d = dx.data();
            if(d.status !== 'archived'){
                d.id = dx.id;
                $localStorage.currentItem = d;
                callback(d);
            }
        });
    };
    //Create a directory to "My Downloads" and make a copy of the selected file
    func.upload = (files,callBack,userId) => {
        let dateNow = new Date();
        const divider = (os.platform() == 'win32')? '\\' : '/';
        const saveFolder = dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider + dateNow.getDate() + divider + userId + divider;
        if(!fs.existsSync(storageFolder)){
            fs.mkdirSync(storageFolder);
        }
        if(!fs.existsSync(storageFolder + dateNow.getFullYear()+divider)){
            fs.mkdirSync(storageFolder + dateNow.getFullYear()+divider);
        }
        if(!fs.existsSync(storageFolder + dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider)){
            fs.mkdirSync(storageFolder + dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider);
        }
        if(!fs.existsSync(storageFolder + dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider + dateNow.getDate() + divider)){
            fs.mkdirSync(storageFolder + dateNow.getFullYear()+divider+ ( dateNow.getMonth() + 1 ) + divider + dateNow.getDate() + divider);
        }
        if(!fs.existsSync(storageFolder + saveFolder)){
            fs.mkdirSync(storageFolder + saveFolder);
        }
        files.forEach(f => {
            setTimeout( () => {
                let path = storageFolder + saveFolder + f.name;
                fs.copyFile(f.path, path, (err) => {
                    if (err) throw err;
                    doc.db.collection(acc).doc(userId).collection(offlineFiles).add({"name":f.name,"path": saveFolder + f.name, "uploaded": false});
                    callBack(saveFolder + f.name,f.name);
                });
            },500);
        });
    }

    //uploads are to PCSD website , pcsd.gov.ph , with unlimited storage
    func.uploadFile = (f,callback) => {
        // if(fs.existsSync(storageFolder + f.path)){
        //     console.log(`uploading ${f.name}:`)
        //     let form = $utils.upload((data,code)=>{
        //         console.log(`done ${code}:`);
        //         callback();
        //         if(code == 200){
        //             if(data.status == 1){
        //                 doc.db.collection(acc).doc(func.$scope.userId).collection(offlineFiles).doc(f.id).update({"uploaded": true});
        //             }else {
        //                 func.$scope.toast("error uploading");
        //                 console.log(data);
        //             }
        //         }
        //     });
        //     form.append('action', 'file/doc_upload');
        //     form.append('userPath', f.path);
        //     form.append('file',  fs.createReadStream(storageFolder + f.path), {filename: f.name});
        // }
    }

    return func;
});