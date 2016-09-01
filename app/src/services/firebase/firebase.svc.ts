import {async, register} from 'platypus';
import BaseService from '../base/base.svc';
import SyndicateRepo from '../../repositories/syndicate/syndicate.repo';

declare var Firebase: any;

export default class FirebaseService extends BaseService {

    constructor(private SynRepo: SyndicateRepo) {
        super()
    }

    initFirebase() {
        return new this.Promise((fulfill, reject) => {
            try {
                var syndicateFirebase = new Firebase("https://escaperoomsyndicate.firebaseio.com");
                var locationsFirebase = syndicateFirebase.child("locations");
                var roomsFirebase = syndicateFirebase.child("rooms");
                var locationsTemp: any;
                var roomsTemp: any;
                
                // syndicateFirebase.authWithOAuthPopup("facebook", function(error:any, authData:any) { 
                //     console.log(error, authData);
                //  });

                locationsFirebase.once("value", (snapshot: any) => {
                    locationsTemp = snapshot.val();
                    //fulfill(snapshot.val());

                    roomsFirebase.once("value", (snapshot: any) => {
                        roomsTemp = snapshot.val();
                        
                        this.SynRepo.locations = locationsTemp;
                        this.SynRepo.rooms = roomsTemp;
                        
                        fulfill();

                    }, (errorObject: any) => {
                        console.log("The read failed: " + errorObject.code);
                    });

                }, (errorObject: any) => {
                    console.log("The read failed: " + errorObject.code);
                });

            } catch (err) {
                reject(err);
            }
        });
    }
}

register.injectable('firebase-svc', FirebaseService, [SyndicateRepo]);
