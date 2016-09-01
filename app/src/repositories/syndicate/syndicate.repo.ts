import {async, register} from 'platypus';
import BaseRepository from '../base/base.repo';

export default class SyndicateRepository extends BaseRepository {
        map: any;
        geocoder: any;
        allMarkers: any;
        allInfoWindows: any;
    
        user: {} = {
            accessToken: "",
            name: "",
            id: "",
        };
        
        // currentLocation: {}
        
        locations: any;
        
        rooms: any;
}

register.injectable('syndicate-repo', SyndicateRepository);
