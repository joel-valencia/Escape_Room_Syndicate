import {register} from 'platypus';
import BaseViewControl from '../base/base.vc';

export default class LocationDetailViewControl extends BaseViewControl {
    templateString: string = require('./locationdetail.vc.html');

    context: any = {};
}

register.viewControl('locationdetail-vc', LocationDetailViewControl);
