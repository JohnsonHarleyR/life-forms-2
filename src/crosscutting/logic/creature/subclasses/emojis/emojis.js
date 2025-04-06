import { EmojiInfo } from "../../../../constants/emojiConstants";
import { ActionType } from "../../../../constants/creatureConstants";
import emojiImg from './creature-emojis.png';
import {getCreatureIdentityString} from '../../../universalLogic';

class Visual {
    constructor(name, url, startX, startY, width, height) {
        this.name = name;
        this.url = url;
        this.startX = startX;
        this.startY = startY;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = url;
    }
}

export default class Emojis {
    constructor(creature) {

        this.creature = creature;
        //this.url = 'creature-emojis.png';
        this.url = emojiImg;

        this.emojis = {
            findSafety: this.createVisual('FIND_SAFETY', EmojiInfo.FIND_SAFETY),
            feedSelf: this.createVisual('FEED_SELF', EmojiInfo.FEED_SELF),
            feedFamily: this.createVisual('FEED_FAMILY', EmojiInfo.FEED_FAMILY),
            foundFood: this.createVisual('FOUND_FOOD', EmojiInfo.FOUND_FOOD),
            createShelter: this.createVisual('CREATE_SHELTER', EmojiInfo.CREATE_SHELTER),
            leaveShelter: this.createVisual('LEAVE_SHELTER', EmojiInfo.LEAVE_SHELTER),
            sleepInShelter: this.createVisual('SLEEP_IN_SHELTER', EmojiInfo.SLEEP_IN_SHELTER),
            sleepInSpot: this.createVisual('SLEEP_IN_SPOT', EmojiInfo.SLEEP_IN_SPOT),
            findMate: this.createVisual('FIND_MATE', EmojiInfo.FIND_MATE),
            gatherFoodToMate: this.createVisual('GATHER_FOOD_TO_MATE', EmojiInfo.GATHER_FOOD_TO_MATE),
            mate: this.createVisual('MATE', EmojiInfo.MATE),
            produceOffspring: this.createVisual('PRODUCE_OFFSPRING', EmojiInfo.PRODUCE_OFFSPRING),
            haveChild: this.createVisual('HAVE_CHILD', EmojiInfo.HAVE_CHILD),
            beDead: this.createVisual('BE_DEAD', EmojiInfo.BE_DEAD),
            die: this.createVisual('DIE', EmojiInfo.DIE),
            none: this.createVisual('NONE', EmojiInfo.NONE)
        }
    }

    drawEmoji = (canvas) => {
        let ctx = canvas.getContext("2d");

        let emojiVisual = this.getCreatureEmoji();

        if (emojiVisual === null) {
            return;
        }

        //console.log(`${getCreatureIdentityString(this.creature)} emoji for: ${emojiVisual.name} {startX: ${emojiVisual.startX}, startY: ${emojiVisual.startY}}`);

        let dx = this.creature.position.x + EmojiInfo.X_OFFSET;
        let dy = this.creature.position.y + EmojiInfo.Y_OFFSET;

        //let isLoaded = emojiVisual.image.complete && emojiVisual.image.naturalHeight !== 0;

        let image = emojiVisual.image;
        ctx.drawImage(image, emojiVisual.startX, emojiVisual.startY,
            emojiVisual.width, emojiVisual.height, dx, dy, emojiVisual.width, emojiVisual.height);
        //image.src = emojiVisual.url;

        // if (!isLoaded) {
        //     emojiVisual.image.addEventListener('load', function () {
        //         ctx.drawImage(emojiVisual.image, emojiVisual.startX, emojiVisual.startY,
        //             emojiVisual.width, emojiVisual.height, dx, dy, emojiVisual.width, emojiVisual.height);
        //     });
        // } else {
        //     ctx.drawImage(emojiVisual.image, emojiVisual.startX, emojiVisual.startY,
        //         emojiVisual.width, emojiVisual.height, dx, dy, emojiVisual.width, emojiVisual.height);
        // }
    }

    getCreatureEmoji = () => {
        switch (this.creature.needs.priority) {
            default:
                return null;
            case ActionType.FIND_SAFETY:
                return this.emojis.findSafety;
            case ActionType.FEED_SELF:
                if (this.creature.currentTarget !== null) {
                    return this.emojis.foundFood;
                }
                return this.emojis.feedSelf;
            case ActionType.FEED_FAMILY:
                if (this.creature.currentTarget !== null) {
                    return this.emojis.foundFood;
                }
                return this.emojis.feedFamily;
            case ActionType.CREATE_SHELTER:
                return this.emojis.createShelter;
            case ActionType.LEAVE_SHELTER:
                return this.emojis.leaveShelter;
            case ActionType.SLEEP_IN_SHELTER:
                return this.emojis.sleepInShelter;
            case ActionType.SLEEP_IN_SPOT:
                return this.emojis.sleepInSpot;
            case ActionType.FIND_MATE:
                return this.emojis.findMate;
            case ActionType.GATHER_FOOD_TO_MATE:
                if (this.creature.currentTarget !== null) {
                    return this.emojis.foundFood;
                }
                return this.emojis.gatherFoodToMate;
            case ActionType.MATE:
                return this.emojis.mate;
            case ActionType.PRODUCE_OFFSPRING:
                return this.emojis.produceOffspring;
            case ActionType.HAVE_CHILD:
                return this.emojis.haveChild;
            case ActionType.BE_DEAD:
                return this.emojis.beDead;
            case ActionType.DIE:
                return this.emojis.die;
            case ActionType.NONE:
                return this.emojis.none;
        }
    }

    createVisual = (name, gridPos) => {
        let width = EmojiInfo.WIDTH;
        let height = EmojiInfo.HEIGHT;
        let startX = gridPos.x * width;
        let startY = gridPos.y * height;

        let visual = new Visual(name, this.url, startX, startY, width, height);
        return visual;
    }
}