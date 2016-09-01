import {register} from 'platypus';
import BaseViewControl from '../base/base.vc';
import FirebaseService from '../../services/firebase/firebase.svc';
import FacebookService from '../../services/facebook/facebook.svc';
import MapsService from '../../services/maps/maps.svc';
import SyndicateRepo from '../../repositories/syndicate/syndicate.repo';

declare var initMap:any;
declare var google:any;
declare var FB:any;
declare var plat:any;

export default class HomeViewControl extends BaseViewControl {
    templateString: string = require('./home.vc.html');

    context: any = {
        currentLocationOriginalIndex: "",
        markersInViewport: [],
        locations: null
    };
    
    constructor(private fbSvc:FacebookService, private synRepo:SyndicateRepo, private mapsSvc:MapsService, private firebaseSvc:FirebaseService) {
        super();
    }
    
    navigatedTo() {
        // this can happen earlier because the navbar is in index.html
        this.fbSvc.initFB();
    }
    
    loaded() {
        this.mapsSvc.initMap().then(() => {
            this.firebaseSvc.initFirebase().then(() => {
                // copy locations from repo to context, and add empty rooms array
                this.context.locations = JSON.parse(JSON.stringify(this.synRepo.locations));
                for (var key in this.context.locations) {
                    this.context.locations[key].rooms = [];
                };
                
                // fill rooms array of each location
                for (var roomKey in this.synRepo.rooms) {
                    var locationKey = this.synRepo.rooms[roomKey].location
                    var targetRoom = this.context.locations[locationKey];
                    targetRoom.rooms.push(this.synRepo.rooms[roomKey]);
                };
                //console.log(this.context.locations);
                
                this.mapsSvc.initPins();
                this.moreMapStuff();
            });
        });
    };
    
    moreMapStuff() {
        console.log("pins loaded:", this.synRepo.allMarkers.length);
        
        // initial marker results
        this.findMarkersInViewport();
        
        // get marker results on viewport change
        this.synRepo.map.addListener('bounds_changed', () => {
            this.findMarkersInViewport();
        });
        
        // add click listeners to all markers
        var thisHome = this;
        var synRepo = this.synRepo;
        
        for (var i = 0; i < this.synRepo.allMarkers.length; i++) {
            this.synRepo.allMarkers[i].addListener('click', function() {
                console.log("clicked marker at index", this.title);
                
                if (thisHome.context.currentLocationOriginalIndex == this.title) {
                    // forget current location index
                    thisHome.context.currentLocationOriginalIndex = "";
                    
                    // close respective info window
                    synRepo.allInfoWindows[this.title].close();
                    
                    // unhighlight all panels
                    for (var i = 0; i < thisHome.context.markersInViewport.length; i++) {
                        thisHome.context.markersInViewport[i].cssClass = "result panel panel-default"
                    };
                } else {
                    // set current location index
                    thisHome.context.currentLocationOriginalIndex = this.title;
                    
                    // unhighlight all panels
                    for (var i = 0; i < thisHome.context.markersInViewport.length; i++) {
                        thisHome.context.markersInViewport[i].cssClass = "result panel panel-default"
                    };
                    
                    // highlight respective result panel
                    for (var i = 0; i < thisHome.context.markersInViewport.length; i++) {
                        if (thisHome.context.markersInViewport[i].originalIndex == this.title) {
                            thisHome.context.markersInViewport[i].cssClass = "result panel panel-primary";
                        };
                    };
                };
            });
        };
        
        // add closeclick listeners to all markers
        for (var i = 0; i < synRepo.allInfoWindows.length; i++) {
            google.maps.event.addListener(synRepo.allInfoWindows[i], "closeclick", function() {
                // forget current location index
                thisHome.context.currentLocationOriginalIndex = "";
                // unhighlight all panels
                for (var i = 0; i < thisHome.context.markersInViewport.length; i++) {
                    thisHome.context.markersInViewport[i].cssClass = "result panel panel-default"
                };
            });
        };
    };
    
    geocodeAddress() {
        var thisHome = this;
        var synRepo = this.synRepo;
        var address = (<HTMLInputElement>document.getElementById('address')).value;
        
        synRepo.geocoder.geocode({'address': address}, function(results:any, status:any) {
            if (status === google.maps.GeocoderStatus.OK) {
                synRepo.map.setCenter(results[0].geometry.location);
                var bounds = {
                    south: results[0].geometry.viewport.getSouthWest().lat(),
                    west: results[0].geometry.viewport.getSouthWest().lng(),
                    north: results[0].geometry.viewport.getNorthEast().lat(),
                    east: results[0].geometry.viewport.getNorthEast().lng()
                }
                synRepo.map.fitBounds(bounds);
                thisHome.findMarkersInViewport();
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }
    
    findMarkersInViewport() {
        var allMarkers:any = this.synRepo.allMarkers;
        var currentBounds:any = this.synRepo.map.getBounds();
        var locations:any = this.context.locations;
        var rooms:any = this.synRepo.rooms;
        this.context.markersInViewport = [];
        
        for (var i = 0; i < allMarkers.length; i++) {
            var locationKey:string = Object.keys(locations)[i];
            
            if (currentBounds.contains(allMarkers[i].getPosition())) {
                this.context.markersInViewport.push(locations[locationKey]);
                
                // add extra info i need to the record
                var lastIndex = this.context.markersInViewport.length - 1;
                var lastRecord = this.context.markersInViewport[lastIndex];
                lastRecord.originalIndex = i;
                lastRecord.originalKey = locationKey;
                lastRecord.numRooms = lastRecord.rooms.length;
                
                // if this is the current location, highlight it
                // console.log(String(i), this.context.currentLocationOriginalIndex);
                if (String(i) === String(this.context.currentLocationOriginalIndex)) {
                    lastRecord.cssClass = "result panel panel-primary";
                } else {
                    lastRecord.cssClass = "result panel panel-default";
                }
                

            }
        }
        
        //console.log(this.context.markersInViewport);
    }
    
    togglePanelHighlight(originalIndex:any) {
        console.log("tapped panel with originalIndex", originalIndex);


        if (String(this.context.currentLocationOriginalIndex) == String(originalIndex)) {
            // tapped panel of current location
            this.context.currentLocationOriginalIndex = "";
            
            // close all info windows
            for (var i = 0; i < this.synRepo.allInfoWindows.length; i++) {
                this.synRepo.allInfoWindows[i].close();
            }

        } else {
            // tapped panel of different location
            this.context.currentLocationOriginalIndex = originalIndex;
            
            // close all info windows
            for (var i = 0; i < this.synRepo.allInfoWindows.length; i++) {
                this.synRepo.allInfoWindows[i].close();
            }
            
            // open single info window
            this.synRepo.allInfoWindows[originalIndex].open(this.synRepo.map, this.synRepo.allMarkers[originalIndex]);

        }

        console.log("set current location to", this.context.currentLocationOriginalIndex)
        this.findMarkersInViewport();
    }
};

register.viewControl('home-vc', HomeViewControl, [FacebookService, SyndicateRepo, MapsService, FirebaseService]);
