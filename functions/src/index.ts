import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

const ti = 60 * 1000;
const th = 60 * ti;
const td = 24 * th;
const tm = 30 * td;
const ty = 12 * tm;


function requireFields(f:Array<string>,data:any):boolean{
    let r = false;
    f.forEach(p => {
        if (data[p] === undefined){
            r = true;
        }else {
            r = false;
        }
    });
    return r;
}

function date_now(): string {
    const date = new Date();
    //YYYY-MM-DD HH:mm:ss
    return date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate() + ' ' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCMilliseconds();
}

function to_date(datenumber:number): string {
    const date = new Date(datenumber);
    //YYYY-MM-DD HH:mm:ss
    return date.getUTCFullYear() + '-' + (date.getUTCMonth() + 1) + '-' + date.getUTCDate() + ' ' + date.getUTCHours() + ':' + date.getUTCMinutes() + ':' + date.getUTCMilliseconds();
}

function notify_applicant(applicantId:string,transactionId:string,message:string,dateNumber: number): Promise<FirebaseFirestore.DocumentReference> {
    return admin.firestore().collection(`notifications`).add({
        "type" : "applicant",
        "user" : applicantId,
        "transaction_id" : transactionId,
        "transaction_date" : dateNumber,
        "message" : message,
        "status" : "0",
        "date" : Date.now()
    });
}

function create_log(staffId:string, message:string, type?:string): Promise<FirebaseFirestore.DocumentReference>{
    return admin.firestore().doc(`staffs/${staffId}`).collection('logs').add({
        name: (type === undefined)? "action": type,
        message: message,
        date: Date.now()
    });
}

exports.receive_transaction = functions.https.onCall((data) => {
    if (requireFields(['doc_id','staff','applicant_id','staff_id','doc_date','applicant_name'],data)) {
        return {error:'fields required: doc_id, staff, applicant_id, staff_id, doc_date, applicant_name'};
    }else {
        return admin.firestore().doc(`transactions/${data.doc_id}`).update(
            {
                "level":"5",
                "status":"1",
                "data.received" : {
                    "staff" : data.staff,
                    "date" : date_now()
                }
            }
        ).then(() => {
            return notify_applicant(data.applicant_id, data.doc_id,`Your application was received and accepted for processing.`,data.doc_date).then(() => {
                const act = `You received application number ${data.doc_date} of ${data.applicant_name} on ${to_date(data.doc_date)}. See your pending box to process application. Thank you.`;
                return create_log(data.staff_id,act).then(() => {
                    return act;
                });
            });
        });
    }
});

exports.reject_transaction = functions.https.onCall((data) => {
    if (requireFields(['doc_id','staff','applicant_id','staff_id','doc_date','applicant_name','reject_reason'],data)) {
        return {error:'fields required: doc_id, staff, applicant_id, staff_id, doc_date, applicant_name, reject_reason'};
    }else {
        return admin.firestore().doc(`transactions/${data.doc_id}`).update(
            {
                "level":"-1",
                "status":"2",
                "data.rejected" : {
                    "message" : data.reject_reason,
                    "staff" : data.staff,
                    "date" : date_now()
                }
            }
        ).then(() => {
            return notify_applicant(data.applicant_id, data.doc_id,`Sorry, we are unable to process your application. Please re-submit. Reason: ${data.reject_reason}.`,data.doc_date).then(() => {
                const act = `You reject application number ${data.doc_date} of ${data.applicant_name} on ${to_date(data.doc_date)}. For the reason of : ${data.reject_reason}.`;
                return create_log(data.staff_id,act).then(() => {
                    return act;
                });
            });
        });
    }
});

exports.process_transaction = functions.https.onCall((data) => {
    if (requireFields(['doc_id','staff','applicant_id','staff_id','doc_date','applicant_name','process_info','returned'],data)) {
        return {error:'fields required: doc_id, staff, applicant_id, staff_id, doc_date, applicant_name, process_info, returned'};
    }else {
        const u = data.process_info;
        u["level"] = "7";
        // if(data.returned){
            u["status"] = "3";
            u["data.accepted"] = {
                "staff" : data.staff,
                "date" : date_now()
            };
        // }
        return admin.firestore().doc(`transactions/${data.doc_id}`).update(u).then(() => {
            return notify_applicant(data.applicant_id, data.doc_id,`Your application is undergoing review.`,data.doc_date).then(() => {
                const act = `You processed application number ${data.doc_date} of ${data.applicant_name} on ${to_date(data.doc_date)}. See your pending box for updates. Thank you.`;
                return create_log(data.staff_id,act).then(() => {
                    return act;
                });
            });
        });
    }
});

exports.review_transaction = functions.https.onCall((data) => {
    if (requireFields(['doc_id','staff','applicant_id','staff_id','doc_date','applicant_name','process_info','returned'],data)) {
        return {error:'fields required: doc_id, staff, applicant_id, staff_id, doc_date, applicant_name, process_info, returned'};
    }else {
        const u = data.process_info;
        u["level"] = "8";
        // if(data.returned){
            u["status"] = "4";
            u["data.approved"] = {
                "staff" : data.staff,
                "date" : date_now()
            };
        // }
        return admin.firestore().doc(`transactions/${data.doc_id}`).update(u).then(() => {
            return notify_applicant(data.applicant_id, data.doc_id,`Your application has been reviewed.`,data.doc_date).then(() => {
                const act = `You reviewed application number ${data.doc_date} of ${data.applicant_name} on ${to_date(data.doc_date)}. See your pending box for updates. Thank you.`;
                return create_log(data.staff_id,act).then(() => {
                    return act;
                });
            });
        });
    }
});

exports.recommend_transaction = functions.https.onCall((data) => {
    if (requireFields(['doc_id','staff','applicant_id','staff_id','doc_date','applicant_name','process_info','returned'],data)) {
        return {error:'fields required: doc_id, staff, applicant_id, staff_id, doc_date, applicant_name, process_info, returned'};
    }else {
        const u = data.process_info;
        u["level"] = "4";
        // if(data.returned){
            u["status"] = "5";
            u["data.recommended"] = {
                "staff" : data.staff,
                "date" : date_now()
            };
        // }
        return admin.firestore().doc(`transactions/${data.doc_id}`).update(u).then(() => {
            return notify_applicant(data.applicant_id, data.doc_id,`Your application has been recommended for approval.`,data.doc_date).then(() => {
                const act = `You recommend application number ${data.doc_date} of ${data.applicant_name} on ${to_date(data.doc_date)}. See your pending box for updates. Thank you.`;
                return create_log(data.staff_id,act).then(() => {
                    return act;
                });
            });
        });
    }
});

exports.approve_transaction = functions.https.onCall((data) => {
    if (requireFields(['doc_id','staff','applicant_id','staff_id','doc_date','applicant_name','process_info','application_name'],data)) {
        return {error:'fields required: doc_id, staff, applicant_id, staff_id, doc_date, applicant_name, process_info, application_name'};
    }else {
        const u = data.process_info;
        u["level"] = "-1";
        u["status"] = "6";
        u["data.acknowledged"] = {
            "staff" : data.staff,
            "date" : date_now()
        };
        if(data.application_name === "Application for Local Transport Permit RFF"){
            u["expiration"] = to_date(Date.now() + (td * 7));
        }else {
            u["expiration"] = to_date(Date.now() + ty);
        }
        return admin.firestore().doc(`transactions/${data.doc_id}`).update(u).then(() => {
            return notify_applicant(data.applicant_id, data.doc_id,`Thank you very much! Your application is approved.`,data.doc_date).then(() => {
                const act = `You approved application number ${data.doc_date} of ${data.applicant_name} on ${to_date(data.doc_date)}.`;
                return create_log(data.staff_id,act).then(() => {
                    return act;
                });
            });
        });
    }
});

exports.on_new_transaction = functions.firestore.document(`transactions/{tranId}`).onCreate((created) => {
    const cd:any = created.data();
    return admin.firestore().collection('staffs').where('user_level','==','5').get().then(qs => {
        qs.forEach(doc => {
            return doc.ref.update({
                "badges.new_transaction": admin.firestore.FieldValue.increment(1)
            }).then(()=>{
                return doc.ref.collection(`notifications`).add({
                    message: `new ${cd.name}`,
                    status: 0
                });
            });
        });
    });
});

exports.on_chat = functions.firestore.document(`chats/{chat}`).onWrite( (updated, context) => {
    const after:any = updated.after.data();
    // const chat = context.params.chat;
    if(after.type !== undefined){
        if(after.type === 'personal'){
            return after.member.forEach((staffId: any) => {
                return admin.firestore().doc(`staffs/${staffId}`).update({
                    "badges.personal_chat": admin.firestore.FieldValue.increment(1)
                }).then(()=>{return null;});
            });
        }else {
            return null;
        }
    }else {
        return null;
    }
});

exports.on_group_chat = functions.firestore.document(`chats/{chat}/treads/{tread}`).onCreate((created, context) => {
    const chatId:string = context.params.chat;
    return admin.firestore().doc(`chats/${chatId}`).get().then(qs=>{
        const cd:any = qs.data();
        return cd.member.forEach((staffId: any) => {
            return admin.firestore().doc(`staffs/${staffId}`).update({
                "badges.group_chat": admin.firestore.FieldValue.increment(1)
            }).then(()=> {
                return admin.firestore().doc(`chats/${chatId}`).update({"count":admin.firestore.FieldValue.increment(1)})
            });
        });
    });
});



/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
////////////////////FOR DOC//////////////////////////////
////////////////////NETWORK//////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////


exports.onAgencyCreate = functions.firestore.document(`agencies/{id}`).onCreate( (created, context) => {
    const id = context.params.id;
    return admin.firestore().doc(`agencies/${id}`).update({"date": Date.now(), "id": id});
} );

exports.onAccountAddAtAgency = functions.firestore.document(`agencies/{id}/accounts/{idB}`).onCreate( (created, context) => {
    const id = context.params.id;
    return admin.firestore().doc(`agencies/${id}`).update({"accounts": admin.firestore.FieldValue.increment(1)});
} );