import {async, register} from 'platypus';
import BaseService from '../base/base.svc';
import SyndicateRepo from '../../repositories/syndicate/syndicate.repo';

declare var google:any;
declare var unitedStates:any;
declare var openDetailPanel:any;

export default class MapsService extends BaseService {
    
    constructor(private synRepo:SyndicateRepo) {
        super();
    };
    
    initMap() {
        return new this.Promise((fulfill, reject) => {
            try {
                console.log("creating map");
                
                // instantiate map
                this.synRepo.map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 4,
                    center: unitedStates
                });
                this.synRepo.map.fitBounds({south: 25.82, west: -124.38999999999999, north: 49.38, east: -66.94});

                this.synRepo.map.addListener('idle', () => {
                    fulfill("map loaded");
                })
                
                // instantiate geocoder
                this.synRepo.geocoder = new google.maps.Geocoder();
                
            } catch (err) {
                reject(err);
            }
        });
    };
    
    initPins() {
        // create pins for each location
        this.synRepo.allMarkers = [];
        this.synRepo.allInfoWindows = [];
        
        let locations:any = this.synRepo.locations;
        
        //console.log("keys:", Object.keys(locations));
        
        for (var i = 0; i < Object.keys(locations).length; i++) {
            var locationKey = Object.keys(locations)[i]
            //console.log("reading location key:", locationKey);
            
            // create markers
            this.synRepo.allMarkers[i] = new google.maps.Marker({
                map: this.synRepo.map,
                position: locations[locationKey].coordinates,
                title: String(i)
            });
            
            // create infowindows
            this.synRepo.allInfoWindows[i] = new google.maps.InfoWindow({
                content: locations[locationKey].name,
                disableAutoPan: true
            });
            
            // open infowindows on marker click
            var thisRepo = this.synRepo;
            
            this.synRepo.allMarkers[i].addListener('click', function() {
                // close all infowindows
                for (var j = 0; j < thisRepo.allInfoWindows.length; j++) {
                    thisRepo.allInfoWindows[j].close();
                }

                //let id:any = this.title;
                
                // open single infowindow
                thisRepo.allInfoWindows[this].open(thisRepo.map, thisRepo.allMarkers[this]);
                //thisRepo.currentLocation = thisRepo.locations[this];
                // console.log(thisRepo.currentLocation);
            }.bind(i));
        }
    }
}

register.injectable('maps-svc', MapsService, [SyndicateRepo]);
